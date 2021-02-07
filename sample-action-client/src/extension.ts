import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
    const basAPI = await vscode.extensions.getExtension("SAPOSS.app-studio-toolkit")?.exports;

    context.subscriptions.push(vscode.commands.registerCommand("perform.action.now", () => {
        const action = new basAPI.actions.CommandAction();
        action.name = "workbench.action.openGlobalSettings";

        basAPI.actions.performAction(action);
    }));

	context.subscriptions.push(vscode.commands.registerCommand("schedule.action", () => {
        const action = new basAPI.actions.CommandAction();
        action.name = "workbench.action.openGlobalSettings";

        vscode.window.showInformationMessage(`Action ${action.name} was scheduled to run`,);
        basAPI.actions.performAction(action, {schedule: true});
    }));
}

export function deactivate() {
}
