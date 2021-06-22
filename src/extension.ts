import { WorkspaceApi } from "@sap/project-api";
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
import { initProjectTypeWatchers } from "./project-type/watcher";
import { BasWorkspaceApi } from "../types/api";

export function activate(context: ExtensionContext) {
  initLogger(context);

  startBasctlServer();

  ActionsController.loadContributedActions();

  ActionsController.performScheduledActions();

  void ActionsController.performActionsFromURL();

  const logger = getLogger().getChildLogger({ label: "activate" });
  logger.info("The App-Studio-Toolkit Extension is active.");

  const workspaceAPI: BasWorkspaceApi = getBasWorkspaceAPI();
  void initTagsContexts(workspaceAPI as WorkspaceApi);
  void initProjectTypeWatchers(workspaceAPI as WorkspaceApi);
  const basToolkitAPI = createBasToolkitAPI(workspaceAPI);

  return basToolkitAPI;
}

export function deactivate() {
  closeBasctlServer();
}
