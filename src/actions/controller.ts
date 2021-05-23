import { extensions } from "vscode";
import { getLogger } from "../logger/logger";
import { IAction } from "@sap-devx/app-studio-toolkit-types";
import { _performAction } from "./performer";
import { getParameter } from '../apis/parameters';
import { ActionsFactory } from './actionsFactory';
import { forEach, get, uniq, compact, split } from "lodash";
import * as actionsConfig from './actionsConfig';


export class ActionsController {
  private static readonly actions: IAction[] = [];

  public static loadContributedActions() {
    forEach(extensions.all, extension => {
      const extensionActions = get(extension, "packageJSON.BASContributes.actions", []);
      forEach(extensionActions, actionAsJson => {
        try {
          const action: IAction = ActionsFactory.createAction(actionAsJson, true);
          ActionsController.actions.push(action);
        } catch (error) {
          getLogger().error(`Failed to create action ${JSON.stringify(actionAsJson)}: ${error}`, { method: "loadContributedActions" });
        }
      });
    });
  }

  public static getAction(id: string): IAction | undefined {
    return ActionsController.actions.find(action => action.id === id);
  }

  public static async performActionsFromParams() {
    const actionsParam = await getParameter("actions");
    const actionsIds = uniq(compact(split(actionsParam, ",")));
    getLogger().trace(`configuration - actionsIds= ${actionsIds}`, { method: "performActionsFromParams" });
      forEach(actionsIds, async actionId => {
      const action = ActionsController.getAction(actionId);
      if (action) {
        await _performAction(action);
      } else {
        getLogger().trace(`action ${actionId} not found`, { method: "performActionsFromParams" });
      }
    });
  }

  public static performScheduledActions() {
    const actionsList: string[] = actionsConfig.get();
    forEach(actionsList, async actionAsJson => {
      try {
        const action: IAction = ActionsFactory.createAction(actionAsJson, true);
        await _performAction(action);
      } catch (error) {
        getLogger().error(`Failed to execute scheduled action ${JSON.stringify(actionAsJson)}: ${error}`, { method: "performScheduledActions" });
      }
    });
    void actionsConfig.clear();
  }
}
