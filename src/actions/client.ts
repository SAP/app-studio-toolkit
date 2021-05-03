import { workspace, ConfigurationTarget } from 'vscode';
import { ActionType, IAction, IFileAction } from './interfaces';
import { _performAction } from './performer';
import { getLogger } from '../logger/logger';
import { set } from 'lodash';


export function performAction(action: IAction, options?: any): Thenable<void> {
    return options?.schedule ? _scheduleAction(action) : _performAction(action);
}

const logger = getLogger().getChildLogger({ label: "client" });

/** Schedule an action for execution after restart */
function _scheduleAction(action: IAction): Thenable<void> {
    const actionsSettings = workspace.getConfiguration();
    const actionsList: any[] = actionsSettings.get("actions", []);
    if (action.actionType === ActionType.File) {
        set(action, "uri", (action as IFileAction).uri.toString());
    }
    actionsList.push(action);
    return actionsSettings.update("actions", actionsList, ConfigurationTarget.Workspace).then(() => {
        logger.trace(`Action '${action.id}' successfuly added to scheduled actions`);
    }, error => {
        logger.error(`Couldn't add '${action.id}' action to scheduled actions: ${error}`);
    });
}
