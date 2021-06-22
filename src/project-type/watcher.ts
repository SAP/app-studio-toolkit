import { ItemWatcherApi, ProjectApi, WorkspaceApi } from "@sap/project-api";
import { debounce, forEach } from "lodash";
import { BasWorkspaceApi } from "../../types/api";
import { initTagsContexts } from "./context-state";
import { getBasWorkspaceAPI } from "./workspace-instance";

const projectWatchers: Map<ProjectApi, ItemWatcherApi> = new Map();

const rebuildVSCodeCustomContext = debounce(() => {
  void initTagsContexts(getBasWorkspaceAPI() as WorkspaceApi);
}, 1000);

export async function initProjectTypeWatchers(
  workspaceApi: WorkspaceApi
): Promise<void> {
  await registerAllProjectsListeners(workspaceApi);
    workspaceApi.onWorkspaceChanged(() => {
    removeAllProjectListeners();
  });
}

async function registerAllProjectsListeners(workspaceApi: BasWorkspaceApi) {
  const projects = await workspaceApi.getProjects();
  forEach(projects, onProjectAdded);
}

function removeAllProjectListeners() {
  projectWatchers.forEach(onProjectRemoved);
}

async function onProjectAdded(projectApi: ProjectApi): Promise<void> {
  const currItemWatcher = await projectApi.watchItems();
  // we are re-building **all** our VSCode custom contexts on every change.
  // to avoid maintaining the complex logic of more granular modifications to
  currItemWatcher.addListener("add", rebuildVSCodeCustomContext);
  currItemWatcher.addListener("update", rebuildVSCodeCustomContext);
  currItemWatcher.addListener("delete", rebuildVSCodeCustomContext);
  projectWatchers.set(projectApi, currItemWatcher);
}

function onProjectRemoved(itemWatcher: ItemWatcherApi ,projectApi: ProjectApi): void {
  void itemWatcher.destroy();
  projectWatchers.delete(projectApi);
}
