import { WorkspaceImpl } from "@sap/project-api";
import { createBasToolkitAPI } from "./api";
import {
  startBasctlServer,
  closeBasctlServer,
} from "./basctlServer/basctlServer";
import { ActionsController } from "./actions/controller";
import { initLogger, getLogger } from "./logger/logger";
import { ExtensionContext } from "vscode";
import {
  getBasWorkspaceAPI
} from "./project-type/workspace-instance";
import { initTagsContexts } from "./project-type/context-state";
import { BasToolkit, BasWorkspaceApi } from "../types/api";

export function activate(context: ExtensionContext) {
  initLogger(context);

  startBasctlServer();

  ActionsController.loadContributedActions();

  ActionsController.performScheduledActions();

  void ActionsController.performActionsFromURL();

  const logger = getLogger().getChildLogger({ label: "activate" });
  logger.info("The App-Studio-Toolkit Extension is active.");

  const workspaceAPI: BasWorkspaceApi = getBasWorkspaceAPI(WorkspaceImpl);
  void initTagsContexts(workspaceAPI);
  const basToolkitAPI: BasToolkit = createBasToolkitAPI(workspaceAPI);

  return basToolkitAPI;
}

export function deactivate() {
  closeBasctlServer();
}
