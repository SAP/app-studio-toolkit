import {
  ItemWatcherApi,
  ProjectApi,
  WorkspaceApi,
} from "@sap/artifact-management";
import { debounce, map } from "lodash";
import { recomputeTagsContexts } from "./custom-context";
import { SetContext } from "./types";

export type ProjectApiForWatcher = Pick<ProjectApi, "watchItems">;

const projectWatchers: Map<ProjectApiForWatcher, ItemWatcherApi> = new Map();

export type WorkspaceAPIForWatcher = Pick<
  WorkspaceApi,
  "onWorkspaceChanged" | "getProjects"
>;
interface InitProjectTypeWatchersOpts {
  setContext: SetContext;
  getWorkspaceAPI: () => WorkspaceAPIForWatcher;
}

export async function initProjectTypeWatchers(
  opts: InitProjectTypeWatchersOpts
): Promise<void> {
  // TODO: call recalculate here for initial state? or keep in extension.ts?
  await registerAllProjectsListeners(opts);
  opts.getWorkspaceAPI().onWorkspaceChanged(async () => {
    // TODO: should we also re-calculate? -- probably yes, and `recomputeTagsContexts` remove from extension.ts?
    await removeAllProjectListeners();
    await registerAllProjectsListeners(opts);
  });
}

interface RegisterAllProjectsListenersOpts {
  setContext: SetContext;
  getWorkspaceAPI: () => WorkspaceAPIForWatcher;
}

async function registerAllProjectsListeners(
  opts: RegisterAllProjectsListenersOpts
) {
  const projects = await opts.getWorkspaceAPI().getProjects();
  await Promise.all(
    map(projects, (projectApi) => onProjectAdded({ projectApi, ...opts }))
  );
}

async function removeAllProjectListeners() {
  const projWatcherEntries = Array.from(projectWatchers.entries());
  // parallel handling
  await Promise.all(
    map(projWatcherEntries, async (entry) =>
      onProjectRemoved(entry[1], entry[0])
    )
  );
}

const RECOMPUTE_DEBOUNCE_DELAY = 1000;

interface OnProjectAddedOpts {
  projectApi: ProjectApiForWatcher;
  setContext: SetContext;
  getWorkspaceAPI: () => WorkspaceAPIForWatcher;
}

async function onProjectAdded(opts: OnProjectAddedOpts): Promise<void> {
  const currItemWatcher = await opts.projectApi.watchItems();
  // voodoo magic, otherwise `updated` event would never be triggered
  await currItemWatcher.readItems();

  // debouncing to avoid performance hit (re-calculating per user key press)
  currItemWatcher.addListener(
    "updated",
    debounce(async () => {
      const allProjects = await opts.getWorkspaceAPI().getProjects();
      // we are re-building **all** our VSCode custom contexts on every change.
      // to avoid maintaining the complex logic of more granular modifications to
      await recomputeTagsContexts(allProjects, opts.setContext);
    }, RECOMPUTE_DEBOUNCE_DELAY)
  );
  projectWatchers.set(opts.projectApi, currItemWatcher);
}

async function onProjectRemoved(
  itemWatcher: ItemWatcherApi,
  projectApi: ProjectApiForWatcher
): Promise<void> {
  await itemWatcher.destroy();
  projectWatchers.delete(projectApi);
}
