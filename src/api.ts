import { extensions } from "vscode";
import { BasToolkit, BasWorkspaceApi } from "@sap-devx/app-studio-toolkit-types";
import { performAction } from "./actions/client";
import { ActionsController } from "./actions/controller";
import {
  ExecuteAction,
  SnippetAction,
  CommandAction,
  FileAction,
} from "./actions/impl";
import { getParameter } from "./apis/parameters";
import { getLogger } from "./logger/logger";
import { WorkspaceApi } from "@sap/project-api";

const basToolkitAPI: Omit<BasToolkit, "workspaceAPI"> = {
  getExtensionAPI: <T>(extensionId: string): Promise<T> => {
    const extension = extensions.getExtension(extensionId);
    const logger = getLogger().getChildLogger({ label: "getExtensionAPI" });

    return new Promise<T>((resolve, reject) => {
      if (extension === undefined) {
        return reject(new Error(`Extension ${extensionId} is not loaded`));
      }

      if (extension.isActive) {
        logger.info(`Detected ${extensionId} is active`);
        resolve(extension.exports as T);
      } else {
        logger.info(`Waiting for activation of ${extensionId}`);
        const intervalId = setInterval(() => {
          if (extension.isActive) {
            logger.info(`Detected activation of ${extensionId}`);
            clearInterval(intervalId);
            resolve(extension.exports as T);
          }
        }, 500);
      }
    });
  },

  getAction: (actionId: string) => ActionsController.getAction(actionId),
  getParameter,
  performAction,

  actions: {
    performAction,
    ExecuteAction,
    SnippetAction,
    CommandAction,
    FileAction,
  }
};

function createWorkspaceProxy(workspaceImpl: WorkspaceApi): BasWorkspaceApi {
  const basWSAPI: BasWorkspaceApi = {
    /* eslint-disable @typescript-eslint/unbound-method */
    getProjects: workspaceImpl.getProjects, 
    getProjectUris: workspaceImpl.getProjectUris, 
    onWorkspaceChanged: workspaceImpl.onWorkspaceChanged
    /* eslint-enable @typescript-eslint/unbound-method */
  };

  return basWSAPI;
}

export function createBasToolkitAPI(workspaceImpl: WorkspaceApi): BasToolkit {
  const workspaceAPI: BasWorkspaceApi = createWorkspaceProxy(workspaceImpl);
  const exportedBasToolkitAPI = {
    // "shallow" clone
    ...basToolkitAPI,
    ...{workspaceAPI},
  };

  // "Immutability Changes Everything"
  // note we are not "deep" freezing because the usage of namespaces on the API
  // is expected to be removed.
  Object.freeze(exportedBasToolkitAPI);
  return exportedBasToolkitAPI;
}
