import { commands, ViewColumn } from 'vscode';
import { get } from 'lodash';
import { getLogger } from '../logger/logger';
import {  IAction, ICommandAction, IExecuteAction, IFileAction, ISnippetAction, } from "../../types/api";

export async function _performAction(action: IAction): Promise<any> {
  const logger = getLogger();
  if (action) {
    logger.trace(
      `performing action ${action.id} of type ${action.actionType}`,
      { action }
    );
    switch (action.actionType) {
      case "COMMAND": {
        const commandAction = (action as ICommandAction);
        return commands.executeCommand(commandAction.name, get(commandAction, "params", []));
      }
      case "EXECUTE": {
        const executeAction = (action as IExecuteAction);
        return executeAction.executeAction(get(executeAction, "params", []));
      }
      case "SNIPPET": {
        const snippetAction = (action as ISnippetAction);
        return commands.executeCommand("loadCodeSnippet", {
          viewColumn: ViewColumn.Two,
          contributorId: snippetAction.contributorId,
          snippetName: snippetAction.snippetName,
          context: snippetAction.context,
          isNonInteractive: snippetAction.isNonInteractive ?? false
        });
      }
      case "FILE": {
        const fileAction = (action as IFileAction);
        return commands.executeCommand('vscode.open', fileAction.uri, {viewColumn: ViewColumn.Two});
      }
      default:
        throw new Error(`actionType = ${action.actionType} is not supported`);
    }
  }
  throw new Error(`Action is not provided`);
}
