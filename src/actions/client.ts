import * as vscode from 'vscode';
import { IAction } from "./interfaces";
import { _performAction } from "./performer";
import { getLogger } from "../logger/logger";


export function performAction(action: IAction, options?: any): Thenable<void> {
    return options?.schedule ? _scheduleAction(action) : _performAction(action);
}

const logger = getLogger().getChildLogger({label: "client"});

/** Schedule an action for execution after restart */
function _scheduleAction(action: IAction): Thenable<void> {
    const actionsSettings = vscode.workspace.getConfiguration();
    const actionsList: any[] = actionsSettings.get("actions", []);
    actionsList.push(action);
    return actionsSettings.update("actions", actionsList, vscode.ConfigurationTarget.Workspace).then(() => { 
        logger.trace("Actions successfuly scheduled");
    }, error => {
        logger.error(`Couldn't schedule action: ${error}`);
    });
}
