import { commands, ViewColumn } from 'vscode';
import { getLogger } from '../logger/logger';
import {
  ActionJsonKey, ActionType,
  IAction, ICommandAction,
  IExecuteAction, IFileAction,
  ISnippetAction
} from './interfaces';
import { get } from 'lodash';

export async function _performAction(action: IAction): Promise<any> {
  const logger = getLogger().getChildLogger({ label: "_performAction" });
  if (action) {
    logger.trace(
      `performing action ${action.id} of type ${action.actionType}`,
      { action }
    );
    switch (action.actionType) {
      case ActionType.Command: {
        const commandAction = (action as ICommandAction);
        return commands.executeCommand(commandAction.name, get(commandAction, "params", []));
      }
      case ActionType.Execute: {
        const executeAction = (action as IExecuteAction);
        return executeAction.executeAction(get(executeAction, "params", []));
      }
      case ActionType.Snippet: {
        const snippetAction = (action as ISnippetAction);
        return commands.executeCommand("loadCodeSnippet", { 
          viewColumn: ViewColumn.Two, 
          contributorId: snippetAction.contributorId, 
          snippetName: snippetAction.snippetName, 
          context: snippetAction.context,
          isNonInteractive: snippetAction.isNonInteractive ?? false
        });
      }
      case ActionType.File: {
        const fileAction = (action as IFileAction);
        return commands.executeCommand('vscode.open', fileAction.uri, {viewColumn: ViewColumn.Two});
      }
      default:
        throw new Error(`${ActionJsonKey.ActionType}=${action.actionType} is not supported`);
    }
  } 
  throw new Error(`Action is not provided`);
}
