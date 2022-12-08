import { WorkspaceImpl, WorkspaceApi } from "@sap/artifact-management";
import * as vscode from "vscode";

let workspaceAPI: WorkspaceApi;

/**
 * "Factory" for the `WorkspaceApi` "original" instance.
 */
export function initWorkspaceAPI(): WorkspaceApi {
  workspaceAPI = new WorkspaceImpl(vscode);
  return workspaceAPI;
}
