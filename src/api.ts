import * as vscode from 'vscode';
//import {isEmpty, get} from 'lodash';
import { performAction } from './actions/client';
import { ActionsController } from './actions/controller';
import { ExecuteAction, SnippetAction, CommandAction, FileAction } from './actions/impl';
import { getLogger } from './logger/logger';
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

    async getParameter(parameterName: string) : Promise<string | undefined> {
        // const onBasEnv = "env.WS_BASE_URL";
        // const isInBAS = !isEmpty(get(process, onBasEnv));
        //const isInBAS = get(process, onBasEnv)?.is;
        // if (!isInBAS) {
        //     getLogger().trace("Running in VS Code, so returning undefined.");
        //     return undefined;
        // }
        // getLogger().trace("Running on BAS.");

        const optionalRequire = require("optional-require")(require);
        const noSapPlugin = "noSapPlugin";
        const sapPlugin = optionalRequire('@sap/plugin') || noSapPlugin;
        if (sapPlugin === noSapPlugin) {
            getLogger().error("Failed to load @sap/plugin, so returning undefined.");
            return undefined;
        } 
        getLogger().trace("@sap/plugin successfully loaded.");

        const configuration = await sapPlugin.window.configuration();
        getLogger().trace("Configuration successfully received.", {configuration});

        const parameterValue = configuration?.[parameterName];
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

