import * as vscode from 'vscode';
import { performAction } from './actions/client';
import { ExecuteAction, SnippetAction, CommandAction, FileAction } from './actions/impl';
export * from "./actions/interfaces";

export const bas = {
    getExtensionAPI: <T>(extensionId: string): Promise<T> => {
        const extension = vscode.extensions.getExtension(extensionId);

        const promise = new Promise<T>((resolve, reject) => {
            let intervalId: NodeJS.Timeout;
            if(extension === undefined) {
                return reject(new Error(`Extension ${extensionId} is not loaded`));
            }
            if (!(extension.isActive)) {
                console.info(`Waiting for activation of ${extensionId}`);
                intervalId = setInterval(() => {
                    if (extension.isActive) {
                        console.info(`Detected activation of ${extensionId}`);
                        clearInterval(intervalId);
                        resolve(extension.exports as T);
                    }
                }, 500);
            } else {
                console.info(`Detected ${extensionId} is active`);
                resolve(extension.exports as T);
            }
        });
    
        return promise;    
    },

    actions: {
        performAction,
        ExecuteAction,
        SnippetAction,
        CommandAction,
        FileAction
    }
};
