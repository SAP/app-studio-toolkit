import { Uri } from "vscode";
import { IAction, ICommandAction, ActionType, IFileAction, ActionJsonKey } from './interfaces';
import { CommandAction, FileAction } from './impl';
import _ = require("lodash");

export class ActionsFactory {
    public static createAction(jsonAction: any) : IAction {
        const actionType = jsonAction[ActionJsonKey.ActionType];
        if (_.isEmpty(actionType)) {
            throw new Error(`${ActionJsonKey.ActionType} is missing`);
        }
        switch (actionType) {
            case ActionType.Command:
                const commandAction: ICommandAction = new CommandAction();
                const commandName = jsonAction[ActionJsonKey.CommandName];
                if (!_.isNil(commandName)) {
                    commandAction.name = commandName;
                } else {
                    throw new Error(`${ActionJsonKey.CommandName} is missing for actionType=${actionType}`);
                }
                const commandParams = jsonAction[ActionJsonKey.CommandParams];
                if (!_.isEmpty(commandParams)) {
                    commandAction.params = commandParams;
                }
                return commandAction;
            case ActionType.File:
                const fileAction: IFileAction = new FileAction();
                const uri = jsonAction[ActionJsonKey.Uri];
                try {
                    fileAction.uri = Uri.parse(uri, true);
                } catch (error) {
                    throw new Error(`Failed to parse field ${ActionJsonKey.Uri}: ${uri} for actionType=${actionType}: ${error.message}`);
                }                
                return fileAction;
            default:
                throw new Error(`${ActionJsonKey.ActionType}=${actionType} is not supported`);
        }
    }
}