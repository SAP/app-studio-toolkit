import { WorkspaceImpl, WorkspaceApi } from "@sap/artifact-management";
import * as vscode from "vscode";
import { CommandExecutor } from "@sap/artifact-management";

let workspaceAPI: WorkspaceApi;

/**
 * "Factory" for the `WorkspaceApi` "original" instance.
 */
export function initWorkspaceAPI(
  context: vscode.ExtensionContext
): WorkspaceApi {
  workspaceAPI = new WorkspaceImpl(vscode);
  workspaceAPI.startWatch();

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "project-api.command.run",
      async (command, ...params) => {
        try {
          let result = await CommandExecutor.execute(command, ...params);
          if (typeof result !== "string") {
            result = JSON.stringify(result, undefined, 2);
          }
          return (result as string) + "\n";
        } catch (error) {
          return (
            `Failed to execute the command ${command} with the error: ${error.message}` +
            "\n"
          );
        }
      }
    )
  );

  return workspaceAPI;
}
