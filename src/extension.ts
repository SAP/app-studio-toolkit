import { bas } from './api';
import { startBasctlServer, closeBasctlServer } from './basctlServer/basctlServer';
import { ActionsController } from './actions/controller';
import { initLogger, getLogger } from './logger/logger';
import { ExtensionContext } from 'vscode';
import { initWorkspaceProjectTypeContexts } from "./project-type/workspace-manager";

export function activate(context: ExtensionContext) {
    initLogger(context);

    startBasctlServer();

    ActionsController.loadContributedActions();

    ActionsController.performScheduledActions();

    void ActionsController.performActionsFromURL();

    const logger = getLogger().getChildLogger({ label: 'activate' });
    logger.info('The App-Studio-Toolkit Extension is active.');

    await initWorkspaceProjectTypeContexts();

    return bas;
}

export function deactivate() {
    closeBasctlServer();
}
