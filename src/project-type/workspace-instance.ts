import { WorkspaceApi, WorkspaceImpl } from "@sap/project-api";

let workspaceAPI: WorkspaceApi;

export function initWorkspaceAPI() {
  workspaceAPI = new WorkspaceImpl();
}

export function getWorkspaceAPI(): WorkspaceApi {
  return workspaceAPI;
}
