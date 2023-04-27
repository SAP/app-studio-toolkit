import { ExtensionKind, Uri, env, extensions } from "vscode";
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
import { join, split, tail } from "lodash";
import { URL } from "node:url";

function isRunInBAS(): boolean {
  const serverUri = process.env.WS_BASE_URL;
  // see example: https://github.com/microsoft/vscode/issues/74188
  // expected values of env.remoteName: `undefined` (locally), `ssh-remote` (bas-remote) or `landscape.url` (BAS)
  if (serverUri && typeof env.remoteName === "string") {
    const remote = join(tail(split(env.remoteName, ".")), ".");
    const host = join(tail(split(new URL(serverUri).hostname, ".")), ".");
    if (host === remote) {
      // see for reference: https://code.visualstudio.com/api/references/vscode-api#Extension
      if (
        extensions.getExtension("SAPOSS.app-studio-toolkit")?.extensionKind ===
        ExtensionKind.Workspace
      ) {
        return true;
      }
    }
  }
  return false;
}

export function activate(context: ExtensionContext): BasToolkit {
  initLogger(context);

  if (isRunInBAS()) {
    startBasctlServer();
  }

  ActionsController.loadContributedActions();

  ActionsController.performScheduledActions();

  void ActionsController.performActionsFromURL();

  const workspaceAPI = initWorkspaceAPI(context);
  const basToolkitAPI = createBasToolkitAPI(workspaceAPI, baseBasToolkitAPI);

  void initBasRemoteExplorer(context);

  const logger = getLogger().getChildLogger({ label: "activate" });
  logger.info("The App-Studio-Toolkit Extension is active.");

  return basToolkitAPI;
}

export function deactivate() {
  closeBasctlServer();
  deactivateBasRemoteExplorer();
}
