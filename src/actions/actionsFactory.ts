import { Uri } from "vscode";
import { IAction, ICommandAction, IFileAction, ISnippetAction, ActionType, basAction } from '@sap-devx/app-studio-toolkit-types';
import { CommandAction, FileAction, SnippetAction } from './impl';
import { COMMAND, SNIPPET, FILE } from '../constants';

const getNameProp = (fromSettings: boolean): string => {
    return fromSettings ? "name" : "commandName";
};
const getParamsProp = (fromSettings: boolean): string => {
    return fromSettings ? "params" : "commandParams";
};

export class ActionsFactory {
    public static createAction(jsonAction: any, fromSettings = false): basAction {
        const actionType: ActionType = jsonAction["actionType"];
        if (!actionType) {
            throw new Error(`actionType is missing`);
        }
        switch (actionType) {
            case COMMAND: {
                return ActionsFactory.handleCommandAction(jsonAction, fromSettings);
            }
            case SNIPPET: {
                return ActionsFactory.handleSnippetAction(jsonAction);
            }
            case FILE: {
                return ActionsFactory.handleFileAction(jsonAction);
            }
            default:
                throw new Error(`Action with type "${actionType}" could not be created from json file`);
        }
    }

    private static handleCommandAction(jsonAction: any, fromSettings = false): basAction {
        const commandAction: ICommandAction = new CommandAction();
        const commandId = jsonAction["id"];
        if (commandId) {
            commandAction.id = commandId;
        }
        const nameProp = getNameProp(fromSettings);
        const commandName = jsonAction[nameProp];
        if (commandName) {
            commandAction.name = commandName;
        } else {
            throw new Error(`${nameProp} is missing for "COMMAND" actionType`);
        }
        const paramsProp = getParamsProp(fromSettings);
        const commandParams = jsonAction[paramsProp];
        if (commandParams) {
            commandAction.params = commandParams;
        }
        return commandAction;
    }

    private static handleSnippetAction(jsonAction: any): basAction {
        const snippetAction: ISnippetAction = new SnippetAction();
        const snippetId = jsonAction["id"];
        if (snippetId) {
            snippetAction.id = snippetId;
        }
        const snippetName = jsonAction["snippetName"];
        if (snippetName) {
            snippetAction.snippetName = snippetName;
        }
        else {
            throw new Error(`snippetName is missing for "SNIPPET" actionType`);
        }
        const contributorId = jsonAction["contributorId"];
        if (contributorId) {
            snippetAction.contributorId = contributorId;
        } else {
            throw new Error(`contributorId is missing for "SNIPPET" actionType`);
        }
        const context = jsonAction["context"];
        if (context) {
            snippetAction.context = context;
        } else {
            throw new Error(`context is missing for "SNIPPET" actionType`);
        }
        const isNonInteractive = jsonAction["isNonInteractive"];
        if (isNonInteractive) {
            snippetAction.isNonInteractive = isNonInteractive;
        }
        return snippetAction;
    }

    private static handleFileAction(jsonAction: any): basAction {
        const fileAction: IFileAction = new FileAction();
        const fileId = jsonAction["id"];
        if (fileId) {
            fileAction.id = fileId;
        }
        const uri = jsonAction["uri"];
        try {
            fileAction.uri = Uri.parse(uri, true);
        } catch (error) {
            throw new Error(
                `Failed to parse field uri: ${uri} for "FILE" actionType: ${error.message}`
            );
        }
        return fileAction;
    }
}
