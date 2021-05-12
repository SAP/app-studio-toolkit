import { extensions } from "vscode";
import { getLogger } from "../logger/logger";
import { IAction } from "./interfaces";
import { _performAction } from "./performer";
import { getParameter } from '../apis/parameters';
import { ActionsFactory } from './actionsFactory';
import { forEach, get, uniq, compact, split } from "lodash";
import * as actionsConfig from './actionsConfig';


export class ActionsController {
  private static readonly actions: IAction[] = [];

  public static loadContributedActions() {
    const logger = getLogger();
    forEach(extensions.all, extension => {
      const extensionActions = get(extension, "packageJSON.BASContributes.actions", []);
      forEach(extensionActions, actionAsJson => {
        try {
          const action: IAction = ActionsFactory.createAction(actionAsJson, true);
          ActionsController.actions.push(action);
        } catch (error) {
          logger.error(`Failed to create action ${JSON.stringify(actionAsJson)}: ${error}`);
        }
      });
    });
  }

  public static getAction(id: string): IAction | undefined {
    return ActionsController.actions.find(action => action.id === id);
  }

  public static async performActionsFromParams() {
    const logger = getLogger().getChildLogger({ label: "performActionsFromParams" });
    const actionsParam = await getParameter("actions");
    const actionsIds = uniq(compact(split(actionsParam, ",")));
    logger.trace(`configuration - actionsIds= ${actionsIds}`);
      forEach(actionsIds, async actionId => {
      const action = ActionsController.getAction(actionId);
      if (action) {
        await _performAction(action);
      } else {
        logger.trace(`action ${actionId} not found`);
      }
    });
  }

  public static performScheduledActions() {
    const logger = getLogger().getChildLogger({ label: "performScheduledActions" });
    const actionsList: string[] = actionsConfig.get();
    forEach(actionsList, async actionAsJson => {
      try {
        const action: IAction = ActionsFactory.createAction(actionAsJson, true);
        await _performAction(action);
      } catch (error) {
        logger.error(`Failed to execute scheduled action ${JSON.stringify(actionAsJson)}: ${error}`);
      }
    });
    void actionsConfig.clear();
  }
}
