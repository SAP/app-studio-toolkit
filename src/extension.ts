import * as vscode from 'vscode';
import { bas } from './api';
import { _performAction } from "./actions/performer";
import { startBasctlServer, closeBasctlServer } from './actions/basctlServer';

const subscriptions: Array<vscode.Disposable> = [];

function performScheduledActions() {
    const actionsSettings = vscode.workspace.getConfiguration();
    const actionsList: any[] | undefined = actionsSettings.get("actions");
    if (actionsList && actionsList.length) {
        for (const action of actionsList) {
            console.log(`performing action ${action.name} of type ${action.constructor.name}`)
            _performAction(action);
        }
        actionsSettings.update("actions", []);
    }
}

export async function activate() {
    startBasctlServer();

    performScheduledActions();

    return bas;
}

export function deactivate() {
    closeBasctlServer();

    for (const subscription of subscriptions) {
        subscription.dispose();
    }
}
