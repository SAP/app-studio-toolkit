import { extensions, commands, window, ExtensionContext, Uri } from 'vscode';
import { bas, ICommandAction, IFileAction } from '@sap-devx/app-studio-toolkit-types';
import * as path from 'path';

export async function activate(context: ExtensionContext) {
    const basAPI: typeof bas = await extensions.getExtension("SAPOSS.app-studio-toolkit")?.exports;

    context.subscriptions.push(commands.registerCommand("get.extension.api", async () => {
        const greeting: string = await basAPI.getExtensionAPI("SAPOSS.sample-action-client");
        void window.showInformationMessage(`${greeting} Extension`);
    }));

    context.subscriptions.push(commands.registerCommand("commandaction.display.settings", () => {
        const action: ICommandAction = new basAPI.actions.CommandAction();
        action.id = "command.action.id";
        action.name = "workbench.action.openSettings";

        void basAPI.actions.performAction(action);
    }));

    context.subscriptions.push(commands.registerCommand("schedule.action", () => {
        const action: ICommandAction = new basAPI.actions.CommandAction();
        action.id = "schedule.action";
        action.name = "workbench.action.openSettings";

        void window.showInformationMessage(`Action ${action.name} was scheduled to run`);
        void basAPI.actions.performAction(action, { schedule: true });
    }));

    context.subscriptions.push(commands.registerCommand("get.parameter", async () => {
        const parameterName = await window.showInputBox({ prompt: "Enter Parameter Name", ignoreFocusOut: true });
        if (parameterName === undefined || parameterName === "") {
            return;
        }

        const parameterValue = await basAPI.getParameter(parameterName);
        void window.showInformationMessage(`${parameterValue} returned for ${parameterName}`);
    }));

    context.subscriptions.push(commands.registerCommand("fileaction.open.file", () => {
        const action: IFileAction = new basAPI.actions.FileAction();
        action.id = "file.action.id";
        action.uri = Uri.file(path.join(context.extensionPath, "./resources/demo.txt"));

        void basAPI.actions.performAction(action);
    }));

    context.subscriptions.push(commands.registerCommand("fileaction.go.to.site", () => {
        const action: IFileAction = new basAPI.actions.FileAction();
        action.id = "site.action.id";
        action.uri = Uri.parse("http://google.com");

        void basAPI.actions.performAction(action);
    }));

    return "Hello from BAS Toolkit Sample";
}
