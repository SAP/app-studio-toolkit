import { ProjectApi, Tag, WorkspaceApi } from "@sap/project-api";
import { Uri, WorkspaceFolder } from "vscode";
import { BasWorkspaceApi } from "../../types/api";

let basWSAPI: BasWorkspaceApi;
/**
 * @param WorkspaceImpl - constructor for the `WorkspaceApi`
 *                        dependency injection is used to enable easier testing
 */
export function getBasWorkspaceAPI(WorkspaceImpl: { new(): WorkspaceApi }): BasWorkspaceApi {
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
    getProjects: (tag?: Tag): Promise<ProjectApi[]> => workspaceImpl.getProjects(tag),
    
    getProjectUris: (): Promise<Uri[]> => workspaceImpl.getProjectUris(),

    onWorkspaceChanged: (handler: (event: string, folders: WorkspaceFolder[]) => void): void => 
      workspaceImpl.onWorkspaceChanged(handler)
  };

  return basWSAPI;
}