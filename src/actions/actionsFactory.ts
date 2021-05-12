import { Uri } from "vscode";
import { IAction, ICommandAction, ActionType, IFileAction, ActionJsonKey, ISnippetAction } from './interfaces';
import { CommandAction, FileAction, SnippetAction } from './impl';
import _ = require("lodash");

const getNameProp = (fromSettings: boolean): string => {
    return fromSettings ? "name" : ActionJsonKey.CommandName;
};
const getParamsProp = (fromSettings: boolean): string => {
    return fromSettings ? "params" : ActionJsonKey.CommandParams;
};

export class ActionsFactory {
    public static createAction(jsonAction: any, fromSettings = false): IAction {
        const actionType = jsonAction[ActionJsonKey.ActionType];
        if (!actionType) {
            throw new Error(`${ActionJsonKey.ActionType} is missing`);
        }
        switch (actionType) {
            case ActionType.Command: {
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
                    throw new Error(`${nameProp} is missing for actionType=${actionType}`);
                }
                const paramsProp = getParamsProp(fromSettings);
                const commandParams = jsonAction[paramsProp];
                if (commandParams) {
                    commandAction.params = commandParams;
                }
                return commandAction;
            }
            case ActionType.Snippet: {
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
                    throw new Error(`snippetName is missing for actionType=${actionType}`);
                }
                const contributorId = jsonAction["contributorId"];
                if (contributorId) {
                    snippetAction.contributorId = contributorId;
                } else {
                    throw new Error(`contributorId is missing for actionType=${actionType}`);
                }
                const context = jsonAction["context"];
                if (context) {
                    snippetAction.context = context;
                }
                const isNonInteractive = jsonAction["isNonInteractive"];
                if (isNonInteractive) {
                    snippetAction.isNonInteractive = isNonInteractive;
                }
                return snippetAction;
            }
            case ActionType.File: {
                const fileAction: IFileAction = new FileAction();
                const fileId = jsonAction["id"];
                if (fileId) {
                    fileAction.id = fileId;
                }
                const uri = jsonAction[ActionJsonKey.Uri];
                try {
                    fileAction.uri = Uri.parse(uri, true);
                } catch (error) {
                    throw new Error(
                        `Failed to parse field ${ActionJsonKey.Uri}: ${uri} for actionType=${actionType}: ${error.message}`
                    );
                }
                return fileAction;
            }
            default:
                throw new Error(`Action with ${ActionJsonKey.ActionType}=${actionType} could not be created from json file`);
        }
    }
}