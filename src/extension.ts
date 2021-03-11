import { bas } from './api';
import { startBasctlServer, closeBasctlServer } from './basctlServer/basctlServer';
import { ActionsController } from './actions/controller';

export async function activate() {
    startBasctlServer();
    
    ActionsController.loadActions();

    ActionsController.performScheduledActions();

    return bas;
}

export function deactivate() {
    closeBasctlServer();
}
