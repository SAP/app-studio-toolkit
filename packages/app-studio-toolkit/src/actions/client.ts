import { workspace, ConfigurationTarget } from "vscode";
import { BasAction } from "@sap-devx/app-studio-toolkit-types";
import { _performAction } from "./performer";
import { getLogger } from "../logger/logger";

export const performAction = <T = void>(
  action: BasAction,
  options?: any
): Thenable<T> => {
  return options?.schedule ? _scheduleAction(action) : _performAction(action);
};

const logger = getLogger().getChildLogger({ label: "client" });

/** Schedule an action for execution after restart */
async function _scheduleAction(action: BasAction): Promise<void> {
  const actionsSettings = workspace.getConfiguration();
  const actionsList: any[] = actionsSettings.get("actions", []);
  actionsList.push(action);
  try {
    await actionsSettings.update(
      "actions",
      actionsList,
      ConfigurationTarget.Workspace
    );
    logger.trace(
      `Action '${action.id}' successfuly added to scheduled actions`
    );
  } catch (error) {
    logger.error(
      `Couldn't add '${action.id}' action to scheduled actions: ${error}`
    );
  }
}
