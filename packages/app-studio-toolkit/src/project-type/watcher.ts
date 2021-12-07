import {
  ItemWatcherApi,
  ProjectApi,
  WorkspaceApi,
} from "@sap/artifact-management";
import { debounce, map, DebouncedFunc } from "lodash";
import { recomputeTagsContexts } from "./custom-context";
import { ProjectApiRead, SetContext } from "./types";
import { KeyIn, Tag } from "@sap/artifact-management-base-types";

export type ProjectApiWatchItems = Pick<ProjectApi, "watchItems">;

const projectWatchers: Map<ProjectApiWatchItems, ItemWatcherApi> = new Map();

export type WorkspaceAPIForWatcher = Pick<
  WorkspaceApi,
  "onWorkspaceChanged"
> & {
  getProjects(
    tag?: KeyIn<typeof Tag>
  ): Promise<(ProjectApiWatchItems & ProjectApiRead)[]>;
};

const RECOMPUTE_DEBOUNCE_DELAY = 1000;

interface DebouncedRecomputeOpts {
  setContext: SetContext;
  getWorkspaceAPI: () => WorkspaceAPIForWatcher;
}

const debouncedRecompute: DebouncedFunc<
  (opts: DebouncedRecomputeOpts) => Promise<void>
> = debounce(async (opts: DebouncedRecomputeOpts) => {
  const allProjects = await opts.getWorkspaceAPI().getProjects();
  // we are re-building **all** our VSCode custom contexts on every change
  // to avoid maintaining the complex logic of more granular modifications to the current state.
  await recomputeTagsContexts(allProjects, opts.setContext);
}, RECOMPUTE_DEBOUNCE_DELAY);

interface InitProjectTypeWatchersOpts {
  setContext: SetContext;
  getWorkspaceAPI: () => WorkspaceAPIForWatcher;
}

export async function initProjectTypeWatchers(
  opts: InitProjectTypeWatchersOpts
): Promise<void> {
  await registerAllProjectsListeners(opts);
  opts.getWorkspaceAPI().onWorkspaceChanged(async () => {
    await removeAllProjectListeners();
    await registerAllProjectsListeners(opts);
    void debouncedRecompute(opts);
  });
}

interface RegisterAllProjectsListenersOpts {
  setContext: SetContext;
  getWorkspaceAPI: () => WorkspaceAPIForWatcher;
}

async function registerAllProjectsListeners(
  opts: RegisterAllProjectsListenersOpts
): Promise<void> {
  const projects = await opts.getWorkspaceAPI().getProjects();
  await Promise.all(
    map(projects, (projectApi) =>
      registerSingleProjectListeners({ projectApi, ...opts })
    )
  );
}

async function removeAllProjectListeners(): Promise<void> {
  const projWatcherEntries = Array.from(projectWatchers.entries());
  // parallel handling
  await Promise.all(
    map(projWatcherEntries, async ([_, currItemWatcher]) =>
      cleanUpProjectRefs(currItemWatcher)
    )
  );
  projectWatchers.clear();
}

interface OnProjectAddedOpts {
  projectApi: ProjectApiWatchItems;
  setContext: SetContext;
  getWorkspaceAPI: () => WorkspaceAPIForWatcher;
}

async function registerSingleProjectListeners(
  opts: OnProjectAddedOpts
): Promise<void> {
  const currItemWatcher = await opts.projectApi.watchItems();
  // voodoo magic, otherwise `updated` event would never be triggered
  await currItemWatcher.readItems();

  // debouncing to avoid performance hit (e.g: re-calculating on every user's key press)
  // TODO: replace this in-lined async with the debounced implementation above (need to test)
  currItemWatcher.addListener("updated", async () => {
    const allProjects = await opts.getWorkspaceAPI().getProjects();
    // we are re-building **all** our VSCode custom contexts on every change
    // to avoid maintaining the complex logic of more granular modifications to the current state.
    await recomputeTagsContexts(allProjects, opts.setContext);
  });
  projectWatchers.set(opts.projectApi, currItemWatcher);
}

async function cleanUpProjectRefs(itemWatcher: ItemWatcherApi): Promise<void> {
  await itemWatcher.destroy();
}
