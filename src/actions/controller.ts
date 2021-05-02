import * as vscode from "vscode";
import { IAction } from "./interfaces";
import { _performAction } from "./performer";
import { forEach, get } from "lodash";
import { getLogger } from "../logger/logger";

export class ActionsController {
  public static readonly actions: IAction[] = [];
  public static readonly logger = getLogger().getChildLogger({label: ActionsController.name});

  public static loadActions() {
    vscode.extensions.all.forEach(extension => {
      const extActions = get(extension, "packageJSON.BASContributes.actions", []);
      extActions.forEach((action: IAction) => {
        this.actions.push(action);
      });
    });
  }

  public static getAction(id: string) {
    return this.actions.find(action => action.id === id);
  }

  public static performScheduledActions() {
    const wsConfiguration = vscode.workspace.getConfiguration();
    const actions: any[] | undefined = wsConfiguration.get("actions");
    forEach(actions, action => {
      this.logger.trace(
        `performing action ${action.name} of type ${action.constructor.name}`
      );
      void _performAction(action);
    });
    
    void wsConfiguration.update("actions", []);
  }
}
