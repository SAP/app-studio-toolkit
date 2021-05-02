import { bas } from './api';
import { startBasctlServer, closeBasctlServer } from './basctlServer/basctlServer';
import { ActionsController } from './actions/controller';
import { initLogger, getLogger } from "./logger/logger";
import { ExtensionContext } from 'vscode';

export function activate(context: ExtensionContext) {
    initLogger(context);
    const logger = getLogger().getChildLogger({ label: "activate" });

    startBasctlServer();

    ActionsController.loadActions();

    ActionsController.performScheduledActions();

    void ActionsController.performActionsFromParams();

    logger.info("The App-Studio-Toolkit Extension is active.");

    return bas;
}

export function deactivate() {
    closeBasctlServer();
}
