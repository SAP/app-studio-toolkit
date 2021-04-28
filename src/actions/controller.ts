import * as vscode from "vscode";
import { getLogger } from "../logger/logger";
import { IAction } from "./interfaces";
import { _performAction } from "./performer";
import { getParameter } from '../apis/parameters';

export class ActionsController {
    private static readonly loggerLabel = "ActionsController";
    public static readonly actions: IAction[] = [];

    public static loadActions() {
      vscode.extensions.all.forEach((extension) => {
        if (extension?.packageJSON?.BASContributes?.actions) {
          (extension.packageJSON.BASContributes.actions as IAction[]).forEach((action) => {
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

    public static async performActionsFromParams() {
      const logger = getLogger().getChildLogger({label: "performActionsFromParams"});
      const actionsList = new Array();

      for (let i = 1 ; i <= 10 ; i++) {
        const actionparam = "action" + i;
        const actionId = await getParameter(actionparam);
        logger.trace(`configuration ${actionparam} = ${actionId}`);
        if (actionId) {
          const action = ActionsController.getAction(actionId);
          if (action){
            logger.trace(`action ${actionId} found`, {action});
            actionsList.push(action);
          }
        }
      }
      ActionsController.performActions(actionsList);
    }

    public static performActions(actionsList: any[]) {
      const logger = getLogger().getChildLogger({label: ActionsController.loggerLabel});
      for (const action of actionsList) {
        logger.trace(
          `performing action ${action.id} of type ${action.actionType}`,
          {action}
        );
        _performAction(action);
      }
    }

    public static performScheduledActions() {
      const actionsSettings = vscode.workspace.getConfiguration();
      const actionsList: any[] | undefined = actionsSettings.get("actions");
      if (actionsList && actionsList.length) {
        ActionsController.performActions(actionsList);
        actionsSettings.update("actions", []);
      }
    }

}
