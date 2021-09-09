// TODO: should we import `WorkspaceImpl` here on in "extension.ts" ?
import { WorkspaceImpl, WorkspaceApi } from "@sap/artifact-management";
import { workspace } from "vscode";

let workspaceAPI: WorkspaceApi;

/**
 * "Factory" for the `WorkspaceApi` "original" instance.
 *  The constructor dependency injection is used to allow simple unit testing.
 *
 * @param WorkspaceApiConstructor - constructor for the `WorkspaceApi`
 */
export function initWorkspaceAPI(
  WorkspaceApiConstructor: {
    new (): WorkspaceApi;
  } = WorkspaceImpl
): WorkspaceApi {
  // @ts-expect-error - we "patched" the `WorkspaceImpl` constructor while waiting for official patch.
  workspaceAPI = new WorkspaceApiConstructor(workspace);
  workspaceAPI.startWatch();

  return workspaceAPI;
}
