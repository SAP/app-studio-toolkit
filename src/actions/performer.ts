import * as vscode from "vscode";
import { ActionType, IAction, ICommandAction, IExecuteAction, IFileAction, ISnippetAction, IOpenBrowserAction } from "./interfaces";

export async function _performAction(action: IAction): Promise<any> {
  if (action) {
    switch ((action as IAction).actionType) {
      case ActionType.Command:
        let commandAction = (action as ICommandAction);
        return vscode.commands.executeCommand(commandAction.name, commandAction.params);
      case ActionType.Execute:
        let executeAction = (action as IExecuteAction);
        if (executeAction.params) {
          return executeAction.executeAction(executeAction.params);
        } else {
          return executeAction.executeAction();
        }
      case ActionType.Snippet:
        let snippetAction = (action as ISnippetAction);
        return vscode.commands.executeCommand("loadCodeSnippet", { viewColumn: vscode.ViewColumn.Two, contributorId: snippetAction.contributorId, snippetName: snippetAction.snippetName, context: snippetAction.context });
      case ActionType.File:
        let fileAction = (action as IFileAction);
        return vscode.commands.executeCommand('vscode.open', fileAction.uri, {viewColumn: vscode.ViewColumn.Two});
      case ActionType.OpenBrowser:
        let openBrowserAction = (action as IOpenBrowserAction);
        return vscode.env.openExternal(openBrowserAction.uri);
    }
  }
}
