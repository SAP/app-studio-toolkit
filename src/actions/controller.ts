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

  public static async performActionsFromURL() {
    const actionsParam = await getParameter("actions");
    if (actionsParam === undefined) {
      return;
    }
    const decodedActionsParam = decodeURI(actionsParam);
    getLogger().trace(`decodedActionsParam= ${decodedActionsParam}`, { method: "performActionsFromURL" });
    const mode = ActionsController.detectActionMode(decodedActionsParam);
    switch (mode) {
      case "IDs": {
        const actionsIds = uniq(compact(split(decodedActionsParam, ",")));
        ActionsController.performActionsIds(actionsIds);
        break;
      }
      case "Inlined": {
        ActionsController.perfomInlinedActions(decodedActionsParam.trim());
        break;
      }
    }
  }

  private static detectActionMode(decodedActionsParam:string): "IDs" | "Inlined" {
    try {
      if (Array.isArray(JSON.parse(decodedActionsParam))) {
        // actionsInlinedMode
        // actions=[{"id":"openSettings","actionType":"COMMAND","name":"workbench.action.openSettings"},{"actionType":"FILE","uri":"https://www.google.com/"}]
        return "Inlined";
      }
    }
    catch (e) {
      // actionsIDsMode
      //actions=openSettings,openGoogle
    }
    return "IDs";
  }

  private static performActionsIds(actionsIds: string[]) {
    getLogger().trace(`actionsIds= ${actionsIds}`, { method: "performActionsIds" });
      forEach(actionsIds, async actionId => {
      const action = ActionsController.getAction(actionId.trim());
      if (action) {
        await _performAction(action);
      } else {
        getLogger().error(`action ${actionId} not found`, { method: "performActionsIds" });
      }
    });
  }

  private static perfomInlinedActions(actions: string) {
    const actionsArr = JSON.parse(decodeURI(actions));
    getLogger().trace(`inlinedActions= ${JSON.stringify(actionsArr)}`, { method: "perfomInlinedActions" });
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
