import { Uri } from "vscode";
import { IAction, ICommandAction, ActionType, IOpenBrowserAction } from './interfaces';
import { CommandAction, OpenBrowserAction } from './impl';

export class ActionsFactory {
    public static createAction(jsonAction: any) : IAction {
        switch (jsonAction.actionType) {
            case ActionType.Command:
                const commandAction: ICommandAction = new CommandAction();
                if (jsonAction.commandName) {
                    commandAction.name = jsonAction.commandName;
                }
                if (jsonAction.commandParams) {
                    commandAction.params = jsonAction.commandParams;
                }
                return commandAction;
            case ActionType.OpenBrowser:
                const openBrowserAction: IOpenBrowserAction = new OpenBrowserAction();
                if (jsonAction.url) {
                    openBrowserAction.uri = Uri.parse(jsonAction.url, true);
                }
                return openBrowserAction;
            default:
                throw new Error(`${jsonAction.actionType} is not supported.`);
        }
    }
}