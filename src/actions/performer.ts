import * as vscode from "vscode";
import { getLogger } from "../logger/logger";
import { ActionJsonKey, ActionType, IAction, ICommandAction, IExecuteAction, IFileAction, ISnippetAction } from "./interfaces";

export async function _performAction(action: IAction): Promise<any> {
  const logger = getLogger().getChildLogger({label: "_performAction"});
  if (action) {
    logger.trace(
      `performing action ${action.id} of type ${action.actionType}`,
      {action}
    );
    switch (action.actionType) {
      case ActionType.Command: {
        const commandAction = (action as ICommandAction);
        if (commandAction.params) {
          return vscode.commands.executeCommand(commandAction.name, commandAction.params);
        } else {
          return vscode.commands.executeCommand(commandAction.name);
        }
      }
      case ActionType.Execute: {
        const executeAction = (action as IExecuteAction);
        if (executeAction.params) {
          return executeAction.executeAction(executeAction.params);
        } else {
          return executeAction.executeAction();
        }
      }
      case ActionType.Snippet: {
        const snippetAction = (action as ISnippetAction);
        return vscode.commands.executeCommand("loadCodeSnippet", { viewColumn: vscode.ViewColumn.Two, contributorId: snippetAction.contributorId, snippetName: snippetAction.snippetName, context: snippetAction.context });
      }
      case ActionType.File: {
        const fileAction = (action as IFileAction);
        return vscode.commands.executeCommand('vscode.open', fileAction.uri, {viewColumn: vscode.ViewColumn.Two});
      }
      default:
        throw new Error(`${ActionJsonKey.ActionType}=${action.actionType} is not supported`);
    }
  } else {
    throw new Error(`Action is: ${action} nothing is performed`);
  }
}
