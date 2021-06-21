import { WorkspaceApi } from "@sap/project-api";

// TODO: define subset of properties signatures
let workspaceAPIProxy: WorkspaceApi;

/**
 * @param WorkspaceImpl - constructor for the `WorkspaceApi`
 *                        dependency injection is used to enable easier testing
 */
export function initWorkspaceAPI(WorkspaceImpl: { new():WorkspaceApi}) {
  workspaceAPIProxy = new WorkspaceImpl();
  // TODO: implement "READ-ONLY" proxy
}

// TODO: define subset of properties signatures
export function getWorkspaceAPI(): WorkspaceApi {
  return workspaceAPIProxy;
}
