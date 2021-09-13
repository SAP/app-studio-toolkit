import { WorkspaceImpl, WorkspaceApi } from "@sap/artifact-management";
import { workspace } from "vscode";

let workspaceAPI: WorkspaceApi;

/**
 * "Factory" for the `WorkspaceApi` "original" instance.
 */
export function initWorkspaceAPI(): WorkspaceApi {
  // @ts-expect-error - we "patched" the `WorkspaceImpl` constructor while waiting for official patch.
  workspaceAPI = new WorkspaceImpl(workspace);
  workspaceAPI.startWatch();

  return workspaceAPI;
}
