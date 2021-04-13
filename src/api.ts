import * as vscode from 'vscode';
import { performAction } from './actions/client';
import { ActionsController } from './actions/controller';
import { ExecuteAction, SnippetAction, CommandAction, FileAction } from './actions/impl';
import { getLogger } from './logger/logger';
export * from "./actions/interfaces";
import _ = require('lodash');

export const bas = {
    getExtensionAPI: <T>(extensionId: string): Promise<T> => {
        const extension = vscode.extensions.getExtension(extensionId);

        const promise = new Promise<T>((resolve, reject) => {
            let intervalId: NodeJS.Timeout;
            if(extension === undefined) {
                return reject(new Error(`Extension ${extensionId} is not loaded`));
            }
            if (!(extension.isActive)) {
                getLogger().info(`Waiting for activation of ${extensionId}`);
                intervalId = setInterval(() => {
                    if (extension.isActive) {
                        getLogger().info(`Detected activation of ${extensionId}`);
                        clearInterval(intervalId);
                        resolve(extension.exports as T);
                    }
                }, 500);
            } else {
                getLogger().info(`Detected ${extensionId} is active`);
                resolve(extension.exports as T);
            }
        });
    
        return promise;    
    },

    getAction (actionId: string) {
        return ActionsController.getAction(actionId);
    },

    async getParameter(parameterName: string) : Promise<string | null> {
        const onBasEnv = "env.WS_BASE_URL";
        const isInBAS = !_.isEmpty(_.get(process, onBasEnv));
        if (!isInBAS) {
            getLogger().trace("Running in VS Code, so returning null.");
            return null;
        }
        getLogger().trace("Running on BAS.");

        let sap;
        try {
            sap = require('@sap/plugin');
        } catch (error) {
            getLogger().error("Failed to load @sap/plugin, so returning null.", {error});
            return null;
        }
        getLogger().trace("@sap/plugin successfully loaded.");

        const configuration = await sap.window.configuration();
        getLogger().trace("Configuration successfully received.", {configuration});

        const parameterValue = _.get(configuration, parameterName, null);
        getLogger().trace(`configuration[${parameterName}]=${parameterValue}`, {parameterName, parameterValue});
        return parameterValue;
    },

    actions: {
        performAction,
        ExecuteAction,
        SnippetAction,
        CommandAction,
        FileAction
    }
};
