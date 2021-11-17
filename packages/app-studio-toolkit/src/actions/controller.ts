import { extensions } from "vscode";
import { getLogger } from "../logger/logger";
import { BasAction } from "@sap-devx/app-studio-toolkit-types";
import { _performAction } from "./performer";
import { getParameter } from "../apis/parameters";
import { ActionsFactory } from "./actionsFactory";
import { isArray, forEach, get, uniq, compact, split, isString } from "lodash";
import * as actionsConfig from "./actionsConfig";

export class ActionsController {
  private static readonly actions: BasAction[] = [];

  public static loadContributedActions() {
    forEach(extensions.all, (extension) => {
      const extensionActions = get(
        extension,
        "packageJSON.BASContributes.actions",
        []
      );
      forEach(extensionActions, (actionAsJson) => {
        try {
          const action: BasAction = ActionsFactory.createAction(
            actionAsJson,
            true
          );
          ActionsController.actions.push(action);
        } catch (error) {
          getLogger().error(
            `Failed to create action ${JSON.stringify(actionAsJson)}: ${error}`,
            { method: "loadContributedActions" }
          );
        }
      });
    });
  }

  public static getAction(id: string): BasAction | undefined {
    return ActionsController.actions.find((action) => action.id === id);
  }

  public static async performActionsFromURL() {
    const actionsParam = await getParameter("actions");
    /* istanbul ignore if - a test case for this single branch is not worth the cost > 50 LOC due to mocks */
    if (actionsParam === undefined) {
      // TODO: also uncertain if this branch is even needed, the `detectActionMode` should likely be changed
      //   to return "ByIDs" | "Inlined" | "N/A" and a branch could be added to the `switch(mode)` to explicitly
      //   `return in that scenario.
      return;
    }
    const decodedActionsParam = decodeURI(actionsParam);
    getLogger().trace(`decodedActionsParam= ${decodedActionsParam}`, {
      method: "performActionsFromURL",
    });
    const mode = ActionsController.detectActionMode(decodedActionsParam);
    switch (mode) {
      case "ByIDs": {
        const actionsIds = uniq(compact(split(decodedActionsParam, ",")));
        ActionsController.performActionsByIds(actionsIds);
        break;
      }
      case "Inlined": {
        ActionsController.perfomInlinedActions(decodedActionsParam.trim());
        break;
      }
    }
  }

  private static detectActionMode(
    decodedActionsParam: string
  ): "ByIDs" | "Inlined" {
    try {
      /* istanbul ignore else - ignoring "legacy" missing coverage to enforce all new code to be 100% */
      if (isArray(JSON.parse(decodedActionsParam))) {
        // actionsInlinedMode
        // actions=[{"id":"openSettings","actionType":"COMMAND","name":"workbench.action.openSettings"},{"actionType":"FILE","uri":"https://www.google.com/"}]
        return "Inlined";
      }
    } catch (e) {
      // actionsByIDsMode
      //actions=openSettings,openGoogle
    }
    return "ByIDs";
  }

  private static performActionsByIds(actionsIds: string[]) {
    getLogger().trace(`actionsIds= ${actionsIds}`, {
      method: "performActionsByIds",
    });
    forEach(actionsIds, async (actionId) => {
      const action = ActionsController.getAction(actionId.trim());
      /* istanbul ignore else - testing logger flows not worth the cost... */
      if (action) {
        await _performAction(action);
      } else {
        getLogger().error(`action ${actionId} not found`, {
          method: "performActionsByIds",
        });
      }
    });
  }

  private static perfomInlinedActions(actions: string) {
    const actionsArr = JSON.parse(decodeURI(actions));
    getLogger().trace(`inlinedActions= ${JSON.stringify(actionsArr)}`, {
      method: "perfomInlinedActions",
    });
    forEach(actionsArr, async (actionAsJson) => {
      try {
        const action: BasAction = ActionsFactory.createAction(
          actionAsJson,
          true
        );
        await _performAction(action);
      } catch (error) {
        getLogger().error(
          `Failed to create action ${JSON.stringify(actionAsJson)}: ${error}`,
          { method: "perfomFullActions" }
        );
      }
    });
  }

  public static performScheduledActions() {
    const actionsList: string[] = actionsConfig.get();
    forEach(actionsList, async (actionItem) => {
      try {
        const action = isString(actionItem)
          ? ActionsController.getAction(actionItem)
          : ActionsFactory.createAction(actionItem, true);
        if (action) {
          await _performAction(action);
        }
      } catch (error) {
        getLogger().error(
          `Failed to execute scheduled action ${JSON.stringify(actionItem)}
          )}: ${error}`,
          { method: "performScheduledActions" }
        );
      }
    });
    void actionsConfig.clear();
  }
}
