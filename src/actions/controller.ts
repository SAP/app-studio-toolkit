import * as vscode from "vscode";
import { IAction } from "./interfaces";
import { _performAction } from "./performer";


export class ActionsController {
    private readonly actions: IAction[] = [];

    loadActions() {
      vscode.extensions.all.forEach((extension) => {
        if (extension.packageJSON.BAScontributes && extension.packageJSON.BAScontributes.actions)
        {
            this.actions.push(extension.packageJSON.BAScontributes.actions);
        }
      });
    }

    performScheduledActions() {
        const actionsSettings = vscode.workspace.getConfiguration();
        const actionsList: any[] | undefined = actionsSettings.get("actions");
        if (actionsList && actionsList.length) {
          for (const action of actionsList) {
            console.log(
              `performing action ${action.name} of type ${action.constructor.name}`
            );
            _performAction(action);
          }
          actionsSettings.update("actions", []);
        }
      }
}
