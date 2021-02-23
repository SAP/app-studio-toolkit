import * as vscode from 'vscode';
import { IAction } from "./interfaces";
import { _performAction } from "./performer";

export async function performAction(action: IAction, options?: any): Promise<void> {
    if (options?.schedule) {
        await _scheduleAction(action);
    } else {
        _performAction(action);
    }
}

/** Schedule an action for execution after restart */
async function _scheduleAction(action: IAction): Promise<void> {
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
