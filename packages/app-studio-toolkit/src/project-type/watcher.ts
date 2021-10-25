import {
  ItemWatcherApi,
  ProjectApi,
  WorkspaceApi,
} from "@sap/artifact-management";
import { debounce, map, now } from "lodash";
import { recomputeTagsContexts } from "./custom-context";
import { getWorkspaceAPI } from "./workspace-instance";
// TODO: pass this using DI from extension.ts?
import { setContextVSCode } from "./vscode-impl";
// import { getLogger } from "../logger/logger";

const projectWatchers: Map<ProjectApi, ItemWatcherApi> = new Map();

export async function initProjectTypeWatchers(
  workspaceImpl: WorkspaceApi
): Promise<void> {
  await registerAllProjectsListeners(workspaceImpl);
  workspaceImpl.onWorkspaceChanged(async () => {
    await removeAllProjectListeners();
    await registerAllProjectsListeners(workspaceImpl);
  });
}

async function registerAllProjectsListeners(workspaceImpl: WorkspaceApi) {
  const projects = await workspaceImpl.getProjects();
  await Promise.all(map(projects, onProjectAdded));
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
async function onProjectAdded(projectApi: ProjectApi): Promise<void> {
  const currItemWatcher = await projectApi.watchItems();
  // voodoo magic, otherwise `updated` event would never be triggered
  await currItemWatcher.readItems();

  // debouncing to avoid performance hit (re-calculating per user key press)
  currItemWatcher.addListener("updated", debounce(async () => {
    const allProjects = await getWorkspaceAPI().getProjects();
    const start = now();
    // we are re-building **all** our VSCode custom contexts on every change.
    // to avoid maintaining the complex logic of more granular modifications to
    await recomputeTagsContexts(allProjects, setContextVSCode);
    const end = now();
    const total = end - start;
    console.log(end + "ms");
    // getLogger().fatal(total + "ms")
  }, RECOMPUTE_DEBOUNCE_DELAY));
  projectWatchers.set(projectApi, currItemWatcher);
}

async function onProjectRemoved(
  itemWatcher: ItemWatcherApi,
  projectApi: ProjectApi
): Promise<void> {
  await itemWatcher.destroy();
  projectWatchers.delete(projectApi);
}
