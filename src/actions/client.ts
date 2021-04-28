import * as vscode from 'vscode';
import { IAction } from "./interfaces";
import { _performAction } from "./performer";

export function performAction(action: IAction, options?: any): Thenable<void> {
    if (options?.schedule) {
        return _scheduleAction(action);
    } else {
        return _performAction(action);
    }
}

/** Schedule an action for execution after restart */
function _scheduleAction(action: IAction): Thenable<void> {
    const actionsSettings = vscode.workspace.getConfiguration();
    let actionsList: any[] | undefined = actionsSettings.get("actions");
    if (!actionsList) {
        actionsList = [];
    }
    actionsList.push(action);
    return actionsSettings.update("actions", actionsList, vscode.ConfigurationTarget.Workspace).then(() => { 
        console.error("");
    }, error => {
        console.error(`Couldn't schedule action: ${error}`);
    });
}
