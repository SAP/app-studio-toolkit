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
      const actionsList = [];

      const actionParam = await getParameter("action");
      const actionsParam = await getParameter("actions");
      logger.trace(`configuration - action= ${actionParam}, actions= ${actionsParam}`);
      const actionIds = actionsParam?.split(",") || [];
      if (actionParam) actionIds.push(actionParam);
      if (actionIds.length > 0) {
        for (const actionId of actionIds) {
          const action = ActionsController.getAction(actionId);
          if (action){
            logger.trace(`action ${actionId} found`, {action});
            actionsList.push(action);
          } else {
            logger.trace(`action ${actionId} not found`);
          }
        }
        ActionsController.performActions(actionsList);
      }
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
