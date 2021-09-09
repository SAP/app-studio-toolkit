import { createBasToolkitAPI } from "./api";
import {
  startBasctlServer,
  closeBasctlServer,
} from "./basctlServer/basctlServer";
import { ActionsController } from "./actions/controller";
import { initLogger, getLogger } from "./logger/logger";
import { ExtensionContext } from "vscode";
import { initWorkspaceAPI } from "./project-type/workspace-instance";

export function activate(context: ExtensionContext) {
  initLogger(context);

  startBasctlServer();

  ActionsController.loadContributedActions();

  ActionsController.performScheduledActions();

  void ActionsController.performActionsFromURL();

  const workspaceAPI = initWorkspaceAPI();
  const basToolkitAPI = createBasToolkitAPI(workspaceAPI);

  const logger = getLogger().getChildLogger({ label: "activate" });
  logger.info("The App-Studio-Toolkit Extension is active.");

  return basToolkitAPI;
}

export function deactivate() {
  closeBasctlServer();
}
