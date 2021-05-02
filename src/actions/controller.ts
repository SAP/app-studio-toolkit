import * as vscode from "vscode";
import { getLogger } from "../logger/logger";
import { IAction } from "./interfaces";
import { _performAction } from "./performer";
import { getParameter } from '../apis/parameters';
import { forEach, uniq, get, split, compact } from "lodash";

const logger = getLogger().getChildLogger({ label: "ActionsController" });

export class ActionsController {
  private static readonly actions: IAction[] = [];

  public static loadActions() {
    vscode.extensions.all.forEach(extension => {
      const extActions = get(extension, "packageJSON.BASContributes.actions", []);
      extActions.forEach((action: IAction) => {
        ActionsController.actions.push(action);
      });
    });
  }

  public static getAction(id: string) {
    return ActionsController.actions.find(action => action.id === id);
  }

  public static async performActionsFromParams() {
    const actionsParam = await getParameter("actions");
    logger.trace(`configuration - actions= ${actionsParam}`);
    const actionsIds = uniq(compact(split(actionsParam, ",")));
    actionsIds.forEach(actionId => {
      const action = ActionsController.getAction(actionId);
      if (action) {
        logger.trace(
          `performing action ${actionId} of type ${action.actionType}`,
          { action }
        );
        void _performAction(action);
      } else {
        logger.trace(`action ${actionId} not found`);
      }
    });
  }

  public static performScheduledActions() {
    const actionsSettings = vscode.workspace.getConfiguration();
    const actionsList: any[] = actionsSettings.get("actions", []);
    forEach(actionsList, action => {
      logger.trace(
        `performing action ${action.id} of type ${action.actionType}`,
        { action }
      );
      void _performAction(action);
    });
    void actionsSettings.update("actions", []);
  }
}
