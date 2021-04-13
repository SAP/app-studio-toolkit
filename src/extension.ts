import { bas } from './api';
import { startBasctlServer, closeBasctlServer } from './basctlServer/basctlServer';
import { ActionsController } from './actions/controller';
import { initLogger, getLogger } from "./logger/logger";
import { ExtensionContext } from 'vscode';

export async function activate(context: ExtensionContext) {
    initLogger(context);

    startBasctlServer();
    
    ActionsController.loadActions();

    ActionsController.performScheduledActions();

    getLogger().info("The App-Studio-Toolkit Extension is active.");

    return bas;
}

export function deactivate() {
    closeBasctlServer();
}
