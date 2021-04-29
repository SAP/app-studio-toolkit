import * as vscode from "vscode";
import { getLogger } from "../logger/logger";
import { IAction } from "./interfaces";
import { _performAction } from "./performer";
import { getParameter } from '../apis/parameters';
import { forEach, uniq } from "lodash";

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
      const logger = getLogger().getChildLogger({label: ActionsController.loggerLabel});

      const actionParam = await getParameter("action");
      const actionsParam = await getParameter("actions");
      logger.trace(`configuration - action= ${actionParam}, actions= ${actionsParam}`);
      const actionIds = actionParam?.split(",") || [];
      let actionsIds = actionsParam?.split(",") || [];
      actionsIds = actionsIds.concat(actionIds);
      actionsIds = uniq(actionsIds);
      actionsIds.forEach(actionId => {
        const action = ActionsController.getAction(actionId);
        if (action){
          logger.trace(
            `performing action ${actionId} of type ${action.actionType}`,
            {action}
          );
          _performAction(action);
        } else {
          logger.trace(`action ${actionId} not found`);
        }
      });
    }
  
    public static performScheduledActions() {
      const logger = getLogger().getChildLogger({label: ActionsController.loggerLabel});
      const actionsSettings = vscode.workspace.getConfiguration();
      const actionsList: any[] | undefined = actionsSettings.get("actions");
      if (actionsList && actionsList.length) {
        for (const action of actionsList) {
          logger.trace(
            `performing action ${action.id} of type ${action.actionType}`,
            {action}
          );
          _performAction(action);
        }
        actionsSettings.update("actions", []);
      }
    }

}
