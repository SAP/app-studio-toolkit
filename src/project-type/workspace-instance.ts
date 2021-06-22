import { WorkspaceApi, WorkspaceImpl } from "@sap/project-api";
import { BasWorkspaceApi } from "../../types/api";

let basWSAPI: BasWorkspaceApi;

export function getBasWorkspaceAPI(): BasWorkspaceApi {
  if (!basWSAPI) {
    const workspaceImpl = new WorkspaceImpl();

    initWorkspaceImpl(workspaceImpl);

    basWSAPI = createWorkspaceReadOnlyProxy(workspaceImpl);
  }

  return basWSAPI;
}


function initWorkspaceImpl(workspaceImpl: WorkspaceApi): void {
  workspaceImpl.startWatch();
}

function createWorkspaceReadOnlyProxy(workspaceImpl: WorkspaceApi): BasWorkspaceApi {
  const basWSAPI: BasWorkspaceApi = {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    getProjects: workspaceImpl.getProjects, 
    // eslint-disable-next-line @typescript-eslint/unbound-method
    getProjectUris: workspaceImpl.getProjectUris, 
    // eslint-disable-next-line @typescript-eslint/unbound-method
    onWorkspaceChanged: workspaceImpl.onWorkspaceChanged
  };

  return basWSAPI;
}