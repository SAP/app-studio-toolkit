import { extensions } from 'vscode';
import { performAction } from './actions/client';
import { ActionsController } from './actions/controller';
import { ExecuteAction, SnippetAction, CommandAction, FileAction } from './actions/impl';
import { IAction } from './actions/interfaces';
import { getParameter } from './apis/parameters';
import { getLogger } from './logger/logger';

export * from './actions/interfaces';

export const bas = {
    getExtensionAPI: <T>(extensionId: string): Promise<T> => {
        const extension = extensions.getExtension(extensionId);
        const logger = getLogger().getChildLogger({ label: "getExtensionAPI" });

        return new Promise<T>((resolve, reject) => {
            if (extension === undefined) {
                return reject(new Error(`Extension ${extensionId} is not loaded`));
            }

            if (extension.isActive) {
                logger.info(`Detected ${extensionId} is active`);
                resolve(extension.exports as T);
            } else {
                logger.info(`Waiting for activation of ${extensionId}`);
                const intervalId = setInterval(() => {
                    if (extension.isActive) {
                        logger.info(`Detected activation of ${extensionId}`);
                        clearInterval(intervalId);
                        resolve(extension.exports as T);
                    }
                }, 500);
            }
        });
    },

    getAction(actionId: string): IAction | undefined {
        return ActionsController.getAction(actionId);
    },

    getParameter: getParameter,

    actions: {
        performAction,
        ExecuteAction,
        SnippetAction,
        CommandAction,
        FileAction
    }
};
