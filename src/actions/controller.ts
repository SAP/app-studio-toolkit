import * as vscode from "vscode";
import { getLogger } from "../logger/logger";
import { IAction } from "./interfaces";
import { _performAction } from "./performer";
import { getParameter } from '../apis/parameters';
import { forEach, uniq } from "lodash";

export class ActionsController {
    public static readonly actions: IAction[] = [];
    private static readonly logger = getLogger().getChildLogger({label: "ActionsController"});

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
      const actionsParam = await getParameter("actions");
      ActionsController.logger.trace(`configuration - actions= ${actionsParam}`);
      let actionsIds = actionsParam?.split(",") || [];
      actionsIds = uniq(actionsIds);
      actionsIds.forEach(actionId => {
        const action = ActionsController.getAction(actionId);
        if (action){
          ActionsController.logger.trace(
            `performing action ${actionId} of type ${action.actionType}`,
            {action}
          );
          _performAction(action);
        } else {
          ActionsController.logger.trace(`action ${actionId} not found`);
        }
      });
    }
  
    public static performScheduledActions() {
      const actionsSettings = vscode.workspace.getConfiguration();
      const actionsList: any[] | undefined = actionsSettings.get("actions");
      forEach(actionsList, action => {
        ActionsController.logger.trace(
          `performing action ${action.id} of type ${action.actionType}`,
          {action}
        );
        _performAction(action);
      });
      actionsSettings.update("actions", []);
    }
}
