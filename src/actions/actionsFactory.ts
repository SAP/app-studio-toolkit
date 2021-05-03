import { Uri } from "vscode";
import { IAction, ICommandAction, ActionType, IFileAction, ActionJsonKey } from './interfaces';
import { CommandAction, FileAction } from './impl';


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
            case ActionType.File: {
                const fileAction: IFileAction = new FileAction();
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