import { extensions, commands, window, ExtensionContext, Uri } from 'vscode';
import { bas, BasAction, ICommandAction, IExecuteAction, IUriAction } from '@sap-devx/app-studio-toolkit-types';
import * as path from 'path';

export async function activate(context: ExtensionContext) {
    const res = await extensions.getExtension("SAPOSS.app-studio-toolkit");
    const basAPI: typeof bas = res?.exports;

    context.subscriptions.push(commands.registerCommand("get.extension.api", async () => {
        const greeting: string = await basAPI.getExtensionAPI("SAPOSS.sample-action-client");
        void window.showInformationMessage(`${greeting} Extension`);
    }));

    context.subscriptions.push(commands.registerCommand("contrib.action.open.settings", () => {
        const action: BasAction | undefined = basAPI.getAction("contribSearchInFiles");
        if (action) {
            void basAPI.actions.performAction(action);
        }
    }));

    context.subscriptions.push(commands.registerCommand("contrib.action.open.file", () => {
        const action: BasAction | undefined = basAPI.getAction("contribOpenFile");
        if (action) {
            void basAPI.actions.performAction(action);
        }
    }));

    context.subscriptions.push(commands.registerCommand("commandaction.display.settings", () => {
        const action: ICommandAction = {
            actionType: "COMMAND",
            id: "command.action.id",
            name: "workbench.action.openSettings"
        }
        void basAPI.actions.performAction(action);
    }));

    context.subscriptions.push(commands.registerCommand("fileaction.scheduled", () => {
        const uri = Uri.file(path.join(context.extensionPath, "./resources/demo.txt"));
        const action: IUriAction = {
            actionType: "URI",
            id: "scheduled.file.action.id",
            uri: uri
        }
        void window.showInformationMessage(`File will be opened on reloading in 2 seconds`);
        void basAPI.actions.performAction(action, { schedule: true });

        setTimeout(() => {
            const reloadAction: ICommandAction = {
                actionType: "COMMAND",
                id: "reload",
                name: "workbench.action.reloadWindow"
            }
            void basAPI.actions.performAction(reloadAction);
        }, 2000);
    }));

    context.subscriptions.push(commands.registerCommand("executeaction.display.error", () => {
        const executeAction = () => window.showErrorMessage(`Hello from ExecuteAction`);
        const action: IExecuteAction = {
            actionType: "EXECUTE",
            id: "display.error",
            executeAction: executeAction
        }
        void basAPI.actions.performAction(action);
    }));

    context.subscriptions.push(commands.registerCommand("get.parameter", async () => {
        const parameterName = await window.showInputBox({ prompt: "Enter Parameter Name", ignoreFocusOut: true });
        if (parameterName === undefined || parameterName === "") {
            return;
        }

        // const parameterValue = await basAPI.getParameter(parameterName);
        // void window.showInformationMessage(`${parameterValue} returned for ${parameterName}`);
    }));

    context.subscriptions.push(commands.registerCommand("fileaction.open.file", () => {
        const uri = Uri.file(path.join(context.extensionPath, "./resources/demo.txt"));
        const action: IUriAction = {
            actionType: "URI",
            id: "file.action.id",
            uri: uri
        }
        void basAPI.actions.performAction(action);
    }));

    context.subscriptions.push(commands.registerCommand("fileaction.go.to.site", () => {
        const action: IUriAction = {
            actionType: "URI",
            id: "site.action.id",
            uri: Uri.parse("http://google.com")
        }
        void basAPI.actions.performAction(action);
    }));

    context.subscriptions.push(commands.registerCommand("lcap.enabled", async () => {
        const enabledValue = await basAPI.isLCAPEnabled();
        void window.showInformationMessage(`lcap enabled value is ${enabledValue}`);
    }));
    return "Hello from BAS Toolkit Sample";
}
