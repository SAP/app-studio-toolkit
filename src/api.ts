import * as vscode from 'vscode';
import { performAction } from './actions/client';
import { ActionsController } from './actions/controller';
import { ExecuteAction, SnippetAction, CommandAction, FileAction } from './actions/impl';
import { getParameter } from './apis/parameters';
import { getLogger } from './logger/logger';
export * from "./actions/interfaces";

export const bas = {
    getExtensionAPI: <T>(extensionId: string): Promise<T> => {
        const extension = vscode.extensions.getExtension(extensionId);
        const logger = getLogger().getChildLogger({label: "getExtensionAPI"});

        const promise = new Promise<T>((resolve, reject) => {
            let intervalId: NodeJS.Timeout;
            if(extension === undefined) {
                return reject(new Error(`Extension ${extensionId} is not loaded`));
            }
            if (!(extension.isActive)) {
                logger.info(`Waiting for activation of ${extensionId}`);
                intervalId = setInterval(() => {
                    if (extension.isActive) {
                        logger.info(`Detected activation of ${extensionId}`);
                        clearInterval(intervalId);
                        resolve(extension.exports as T);
                    }
                }, 500);
            } else {
                logger.info(`Detected ${extensionId} is active`);
                resolve(extension.exports as T);
            }
        });
    
        return promise;    
    },

    getAction (actionId: string) {
        return ActionsController.getAction(actionId);
    },

    getParameter : getParameter,

    actions: {
        performAction,
        ExecuteAction,
        SnippetAction,
        CommandAction,
        FileAction
    }
};

