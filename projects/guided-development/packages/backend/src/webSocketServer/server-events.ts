import { BasAction, ICommandAction, IExecuteAction, IFileAction, ISnippetAction } from "@sap-devx/app-studio-toolkit-types";
import { AppEvents } from "../app-events";
import { ICollection, IItem, ITurotial } from '../types';

export class ServerEvents implements AppEvents {
    public async performAction(action: BasAction): Promise<any> {
        switch (action.actionType) {
            case "EXECUTE":
                const executeAction: IExecuteAction = (action as IExecuteAction);
                if (executeAction.params) {
                    executeAction.executeAction(executeAction.params);
                } else {
                    executeAction.executeAction();
                }
                break;
            case "COMMAND":
                const commandAction: ICommandAction = (action as ICommandAction);
                console.log(`Mock executing command ${commandAction.name}`);
                break;
            case "FILE":
            case "URI":
                const fileAction: IFileAction = (action as IFileAction);
                console.log(`Mock opening file ${fileAction.uri.path}`);
                break;
            case "SNIPPET":
                const snippetAction: ISnippetAction = (action as ISnippetAction);
                console.log(`Mock running snippet ${snippetAction.snippetName}`);
                break;
            default:
                console.log(`Invalid actionType Mock executing action`);
        }
        return Promise.resolve();    
    }

    setData(extensionId: string, collections: ICollection[], items: IItem[], tutorials?: ITurotial[]): void {
        console.log("setData...................");
    }
}
