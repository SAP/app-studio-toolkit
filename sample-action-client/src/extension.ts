import * as vscode from 'vscode';
import { bas, ICommandAction } from '@sap-devx/app-studio-toolkit-types';

export async function activate(context: vscode.ExtensionContext) {
    const basAPI: typeof bas = await vscode.extensions.getExtension("SAPOSS.app-studio-toolkit")?.exports;

    context.subscriptions.push(vscode.commands.registerCommand("perform.action.now", () => {
        const action: ICommandAction = new basAPI.actions.CommandAction();
        action.id = "perform.action.now"
        action.name = "workbench.action.openGlobalSettings";

        basAPI.actions.performAction(action);
    }));

	context.subscriptions.push(vscode.commands.registerCommand("schedule.action", () => {
        const action: ICommandAction = new basAPI.actions.CommandAction();
        action.id = "schedule.action"
        action.name = "workbench.action.openGlobalSettings";

        vscode.window.showInformationMessage(`Action ${action.name} was scheduled to run`,);
        basAPI.actions.performAction(action, {schedule: true});
    }));

	context.subscriptions.push(vscode.commands.registerCommand("get.parameter", async () => {
        const parameterName = await vscode.window.showInputBox({ prompt: "Enter Parameter Name", ignoreFocusOut: true });
        if (!parameterName) { 
            // undefined in escape and empty on enter
            return;
        }        
        
        const parameterValue = await basAPI.getParameter(parameterName as string);
        vscode.window.showInformationMessage(`${parameterValue} returned for ${parameterName}`,);
    }));

}

export function deactivate() {
}
