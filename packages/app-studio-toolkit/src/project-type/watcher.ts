import {
  ItemWatcherApi,
  ProjectApi,
  WorkspaceApi,
} from "@sap/artifact-management";
import { debounce, map } from "lodash";
import { recomputeTagsContexts } from "./context-state";
import { getWorkspaceAPI } from "./workspace-instance";
import { setContextVSCode } from "./vscode-impl";

const projectWatchers: Map<ProjectApi, ItemWatcherApi> = new Map();

// TODO: re-add debounce
const rebuildVSCodeCustomContext = async () => {
  const allProjects = await getWorkspaceAPI().getProjects();
  await recomputeTagsContexts(allProjects, setContextVSCode);
};

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

async function onProjectAdded(projectApi: ProjectApi): Promise<void> {
  const currItemWatcher = await projectApi.watchItems();
  // we are re-building **all** our VSCode custom contexts on every change.
  // to avoid maintaining the complex logic of more granular modifications to
  currItemWatcher.addListener("updated", async (events, files) => {
    // TODO: wrap in debounce with `rebuildVSCodeCustomContext()` helper
    const allProjects = await getWorkspaceAPI().getProjects();
    await recomputeTagsContexts(allProjects, setContextVSCode);
  });
  projectWatchers.set(projectApi, currItemWatcher);
}

async function onProjectRemoved(
  itemWatcher: ItemWatcherApi,
  projectApi: ProjectApi
): Promise<void> {
  await itemWatcher.destroy();
  projectWatchers.delete(projectApi);
}
