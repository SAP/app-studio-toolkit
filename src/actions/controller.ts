import { extensions } from "vscode";
import { getLogger } from "../logger/logger";
import { IAction } from "./interfaces";
import { _performAction } from "./performer";
import { getParameter } from '../apis/parameters';
import { ActionsFactory } from './actionsFactory';
import * as _ from "lodash";
import * as actionsConfig from './actionsConfig';


export class ActionsController {
  private static readonly actions: IAction[] = [];

  public static loadContributedActions() {
    extensions.all.forEach(extension => {
      const extensionActions = _.get(extension, "packageJSON.BASContributes.actions", []);
      extensionActions.forEach((action: IAction) => ActionsController.actions.push(action));
    });
  }

  public static getAction(id: string): IAction | undefined {
    return ActionsController.actions.find(action => action.id === id);
  }

  public static async performActionsFromParams() {
    const logger = getLogger().getChildLogger({ label: "performActionsFromParams" });
    const actionsParam = await getParameter("actions");
    logger.trace(`configuration - actions= ${actionsParam}`);
    const actionsIds = _.uniq(_.compact(_.split(actionsParam, ",")));
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
    const actionsList: string[] = actionsConfig.get();
    _.forEach(actionsList, actionAsJson => {
      try {
        const action: IAction = ActionsFactory.createAction(actionAsJson, true);
        void _performAction(action);
      } catch (error) {
        logger.error(`Failed to execute scheduled action ${JSON.stringify(actionAsJson)}: ${error}`);
      }
    });
    void actionsConfig.clear();
  }
}
