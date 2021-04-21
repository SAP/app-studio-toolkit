import { bas } from './api';
import { startBasctlServer, closeBasctlServer } from './basctlServer/basctlServer';
import { ActionsController } from './actions/controller';
import { initLogger, getLogger } from "./logger/logger";
import { ExtensionContext } from 'vscode';

export async function activate(context: ExtensionContext) {
    initLogger(context);
    const logger = getLogger().getChildLogger({label: "activate"});

    startBasctlServer();
    
    ActionsController.loadActions();

    ActionsController.performScheduledActions();

    logger.info("The App-Studio-Toolkit Extension is active.");

    const actionIdParameter = "action-id1";
    logger.trace("Getting parameter", {actionIdParameter});
    const actionId = await bas.getParameter(actionIdParameter);
    logger.trace("action-id1 value", {actionId});
    if (actionId !== undefined) {
        const action = ActionsController.getAction(actionId); //"abc123"
        logger.trace("action found", {action})
        const actionsList: any[] = [action];
        ActionsController.performActions(actionsList);
    }

    // const action = {
    //     "actionType": "COMMAND",
    //     "name": "workbench.action.openSettings",
    //     "params": [],
    //     "id": "schedule.action"
    // }

    // getLogger().info("Action", {action});
    // const jsonAction = JSON.stringify(action);
    // getLogger().info("jsonAction", {jsonAction});

    // let receivedFromSapPlugin = await bas.getParameter("action1");

    // receivedFromSapPlugin = "%7B%22actionType%22:%22COMMAND%22,%22name%22:%22workbench.action.openSettings%22,%22params%22:%5B%5D,%22id%22:%22schedule.action%22%7D";
    // const jsonDecodedAction = decodeURI(receivedFromSapPlugin);
    // getLogger().info("decodedAction", {jsonDecodedAction});

    // const decodedAction = JSON.parse(jsonDecodedAction);

    // const actionsList: any[] = [decodedAction];
    // ActionsController.performActions(actionsList);



    return bas;
}

export function deactivate() {
    closeBasctlServer();
}

