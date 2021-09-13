import { ExtensionContext } from "vscode";
import { BasToolkit } from "@sap-devx/app-studio-toolkit-types";
import { createBasToolkitAPI } from "./public-api/create-bas-toolkit-api";
import {
  startBasctlServer,
  closeBasctlServer,
} from "./basctlServer/basctlServer";
import { ActionsController } from "./actions/controller";
import { initLogger, getLogger } from "./logger/logger";
import { initWorkspaceAPI } from "./project-type/workspace-instance";

export function activate(context: ExtensionContext): BasToolkit {
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
