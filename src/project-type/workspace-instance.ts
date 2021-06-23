import { WorkspaceApi } from "@sap/project-api";


let workspaceAPI: WorkspaceApi;

/**
 * @param WorkspaceImpl - constructor for the `WorkspaceApi`
 *                        dependency injection is used to enable easier testing
 */
export function initWorkspaceAPI(WorkspaceImpl: { new():WorkspaceApi}) {
  workspaceAPI = new WorkspaceImpl();
  
  initWorkspaceImpl(workspaceAPI);
}

export function getWorkspaceAPI(): WorkspaceApi {
  return workspaceAPI;
}

function initWorkspaceImpl(workspaceImpl: WorkspaceApi): void {
  workspaceImpl.startWatch();
}
