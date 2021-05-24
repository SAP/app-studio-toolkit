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
    getLogger().trace(`actionsParam= ${actionsParam}`, { method: "performActionsFromParams" });
    if (actionsParam?.startsWith("%5B") || actionsParam?.startsWith("[")) {
      ActionsController.perfomFullActions(actionsParam);
    } else if (actionsParam) {
      ActionsController.performActionsIds(actionsParam);
    }
    
  }

  public static performActionsIds(actions: string) {
    const actionsIds = uniq(compact(split(actions, ",")));
    getLogger().trace(`actionsIds= ${actionsIds}`, { method: "performActionsIds" });
      forEach(actionsIds, async actionId => {
      const action = ActionsController.getAction(actionId);
      if (action) {
        await _performAction(action);
      } else {
        getLogger().error(`action ${actionId} not found`, { method: "performActionsIds" });
      }
    });
  }

  public static perfomFullActions(actions: string) {
    const actionsArr = JSON.parse(decodeURI(actions));
    getLogger().trace(`actions= ${JSON.stringify(actionsArr)}`, { method: "perfomFullActions" });
    forEach(actionsArr, async actionAsJson => {
      try {
        const action: IAction = ActionsFactory.createAction(actionAsJson, true);
        await _performAction(action);
      } catch (error) {
        getLogger().error(`Failed to create action ${JSON.stringify(actionAsJson)}: ${error}`, { method: "perfomFullActions" });
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
