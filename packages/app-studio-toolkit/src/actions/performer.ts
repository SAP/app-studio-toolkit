import { commands, ViewColumn } from "vscode";
import { get } from "lodash";
import { getLogger } from "../logger/logger";
import { BasAction } from "@sap-devx/app-studio-toolkit-types";
import { COMMAND, SNIPPET, FILE, EXECUTE } from "../constants";

export async function _performAction(action: BasAction): Promise<any> {
  const logger = getLogger();
  if (action) {
    logger.trace(
      `performing action ${action.id} of type ${action.actionType}`,
      { action }
    );
    switch (action.actionType) {
      case COMMAND: {
        const params: any = get(action, "params", []);
        return commands.executeCommand(action.name, ...params);
      }
      case EXECUTE: {
        return action.executeAction(get(action, "params", []));
      }
      case SNIPPET: {
        return commands.executeCommand("loadCodeSnippet", {
          viewColumn: ViewColumn.Two,
          contributorId: action.contributorId,
          snippetName: action.snippetName,
          context: action.context,
          isNonInteractive: action.isNonInteractive ?? false,
        });
      }
      case FILE: {
        return action.uri.scheme === "file"
          ? commands.executeCommand("vscode.open", action.uri, {
              viewColumn: ViewColumn.Two,
            })
          : commands.executeCommand("vscode.open", action.uri);
      }
      default:
        throw new Error(`actionType is not supported`);
    }
  }
  throw new Error(`Action is not provided`);
}
