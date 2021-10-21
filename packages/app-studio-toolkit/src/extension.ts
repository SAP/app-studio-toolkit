import { ExtensionContext } from "vscode";
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
import { recomputeTagsContexts } from "./project-type/custom-context";
import { initProjectTypeWatchers } from "./project-type/watcher";
import { setContextVSCode } from "./project-type/vscode-impl";

export function activate(context: ExtensionContext): BasToolkit {
  initLogger(context);

  startBasctlServer();

  ActionsController.loadContributedActions();

  ActionsController.performScheduledActions();

  void ActionsController.performActionsFromURL();

  const workspaceAPI = initWorkspaceAPI();
  const basToolkitAPI = createBasToolkitAPI(workspaceAPI, baseBasToolkitAPI);

  const logger = getLogger().getChildLogger({ label: "activate" });
  // using `.then` instead of `await` to keep the activate function synchronized
  // to avoid automatic wrapping of `BasToolKit` API in a promise.
  workspaceAPI
    .getProjects()
    .then((allProjects) => recomputeTagsContexts(allProjects, setContextVSCode))
    .catch(
      /* istanbul ignore next -- should never get here, not cost effective to reproduce in test */
      (e) => {
        logger.error(
          "Problem during initialization of context menus based on project type tags",
          e
        );
      }
    );

  void initProjectTypeWatchers(workspaceAPI);

  logger.info("The App-Studio-Toolkit Extension is active.");

  return basToolkitAPI;
}

export function deactivate() {
  closeBasctlServer();
}
