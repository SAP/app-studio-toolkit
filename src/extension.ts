import { bas } from './api';
import { startBasctlServer, closeBasctlServer } from './basctlServer/basctlServer';
import { ActionsController } from './actions/controller';

let actionsController;

export async function activate() {
    startBasctlServer();

    actionsController = new ActionsController();
    
    actionsController.loadActions();

    actionsController.performScheduledActions();

    return bas;
}

export function deactivate() {
    closeBasctlServer();
}
