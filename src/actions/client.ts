import * as vscode from 'vscode';
import { IAction } from "./interfaces";
import { _performAction } from "./performer";

export function performAction(action: IAction, options?: any): void {
    if (options?.schedule) {
        _scheduleAction(action);
    } else {
        _performAction(action);
    }
}

/** Schedule an action for execution after restart */
function _scheduleAction(action: IAction) {
    const actionsSettings = vscode.workspace.getConfiguration();
    let actionsList: any[] | undefined = actionsSettings.get("actions");
    if (!actionsList) {
        actionsList = [];
    }
    actionsList.push(action);
    actionsSettings.update("actions", actionsList, vscode.ConfigurationTarget.Workspace).then(() => { }, (reason) => {
        console.error(`Couldn't schedule action: ${reason}`);
    });
}
