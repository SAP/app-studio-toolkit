import { commands, ViewColumn } from "vscode";
import { 
  ActionJsonKey, ActionType, 
  IAction, ICommandAction, 
  IExecuteAction, IFileAction, 
  ISnippetAction } from "./interfaces";

export async function _performAction(action: IAction): Promise<any> {
  if (action) {
    switch (action.actionType) {
      case ActionType.Command: {
        const commandAction = (action as ICommandAction);
        if (commandAction.params) {
          return commands.executeCommand(commandAction.name, commandAction.params);
        } else {
          return commands.executeCommand(commandAction.name);
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
        return commands.executeCommand("loadCodeSnippet", { 
          viewColumn: ViewColumn.Two, 
          contributorId: snippetAction.contributorId, 
          snippetName: snippetAction.snippetName, 
          context: snippetAction.context 
        });
      }
      case ActionType.File: {
        const fileAction = (action as IFileAction);
        return commands.executeCommand('vscode.open', fileAction.uri);
      }
      default:
        throw new Error(`${ActionJsonKey.ActionType}=${action.actionType} is not supported`);
    }
  } 

  throw new Error(`Action is not provided`);
}
