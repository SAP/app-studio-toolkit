import type { ExtensionContext } from "vscode";
import { BasToolkit } from "@sap-devx/app-studio-toolkit-types";
import { baseBasToolkitAPI } from "./public-api/base-bas-api";
import { createBasToolkitAPI } from "./public-api/create-bas-toolkit-api";
import {
  startBasctlServer,
  closeBasctlServer,
} from "./basctlServer/basctlServer";
import { ActionsController } from "./actions/controller";
import { initLogger, getLogger } from "./logger/logger";
import { initWorkspaceAPI } from "./project-type/workspace-instance";
import {
  deactivateBasRemoteExplorer,
  initBasRemoteExplorer,
} from "./devspace-manager/instance";
import {
  startBasKeepAlive,
  shouldRunCtlServer,
  cleanKeepAliveInterval,
} from "./utils/bas-utils";

export function activate(context: ExtensionContext): BasToolkit {
  initLogger(context);

  startBasKeepAlive();

  // should be trigered earlier on acivating because the `shouldRunCtlServer` method sets the context value of `ext.runPlatform`
  if (shouldRunCtlServer()) {
    getLogger().debug("starting basctl server");
    startBasctlServer(context);
  }

  // performance: run the actions after the extension is activated
  setTimeout(() => {
    ActionsController.loadContributedActions();
    ActionsController.performScheduledActions();
    void ActionsController.performActionsFromURL();
  });

  const workspaceAPI = initWorkspaceAPI(context);
  const basToolkitAPI = createBasToolkitAPI(workspaceAPI, baseBasToolkitAPI);

  initBasRemoteExplorer(context);

  const logger = getLogger().getChildLogger({ label: "activate" });
  logger.info("The App-Studio-Toolkit Extension is active.");

  return basToolkitAPI;
}

export function deactivate(): void {
  closeBasctlServer();
  void deactivateBasRemoteExplorer();
  cleanKeepAliveInterval();
}
