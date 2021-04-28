import { extensions, workspace } from "vscode";
import { IAction } from "./interfaces";
import { _performAction } from "./performer";

export class ActionsController {
    public static readonly actions: IAction[] = [];

    public static loadActions() {
      extensions.all.forEach((extension) => {
        if (extension?.packageJSON?.BASContributes?.actions) {
          (extension.packageJSON.BASContributes.actions as IAction[]).forEach(action => {
            this.actions.push(action);
          });
        }
      });
    }

    public static getAction(id: string) {
      for (const action of this.actions) {
        if (action.id === id) {
          return action;
        }
      }
    }

    public static performScheduledActions() {
        const actionsSettings = workspace.getConfiguration();
        const actionsList: any[] | undefined = actionsSettings.get("actions");
        if (actionsList && actionsList.length) {
          for (const action of actionsList) {
            console.log(
              `performing action ${action.name} of type ${action.constructor.name}`
            );
            void _performAction(action);
          }
          void actionsSettings.update("actions", []);
        }
      }
}
