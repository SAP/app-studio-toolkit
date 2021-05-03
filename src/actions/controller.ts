import { workspace, extensions } from "vscode";
import { getLogger } from "../logger/logger";
import { IAction } from "./interfaces";
import { _performAction } from "./performer";
import { getParameter } from '../apis/parameters';
import { ActionsFactory } from './actionsFactory';
import { forEach, uniq, get, split, compact } from "lodash";

export class ActionsController {
  private static readonly actions: IAction[] = [];

  public static loadActions() {
    extensions.all.forEach(extension => {
      const extensionActions = get(extension, "packageJSON.BASContributes.actions", []);
      extensionActions.forEach((action: IAction) => ActionsController.actions.push(action));
    });
  }

  public static getAction(id: string) {
    return ActionsController.actions.find(action => action.id === id);
  }

  public static async performActionsFromParams() {
    const logger = getLogger().getChildLogger({ label: "performActionsFromParams" });
    const actionsParam = await getParameter("actions");
    logger.trace(`configuration - actions= ${actionsParam}`);
    const actionsIds = uniq(compact(split(actionsParam, ",")));
    actionsIds.forEach(actionId => {
      const action = ActionsController.getAction(actionId);
      if (action) {
        void _performAction(action);
      } else {
        logger.trace(`action ${actionId} not found`);
      }
    });
  }

  public static performScheduledActions() {
    const logger = getLogger().getChildLogger({ label: "performScheduledActions" });
    const actionsSettings = workspace.getConfiguration();
    const actionsList: any[] = actionsSettings.get("actions", []);
    forEach(actionsList, (actionAsJson: string) => {
      try {
        const action: IAction = ActionsFactory.createAction(actionAsJson, true);
        void _performAction(action);
      } catch (error) {
        logger.error(`Faild to execute scheduled action ${actionAsJson}: ${error}`);
      }
    });
    void actionsSettings.update("actions", []);
  }
}
