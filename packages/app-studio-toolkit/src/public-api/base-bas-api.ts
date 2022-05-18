import { extensions } from "vscode";
import { BasToolkit } from "@sap-devx/app-studio-toolkit-types";
import { performAction } from "../actions/client";
import { ActionsController } from "../actions/controller";
import {
  ExecuteAction,
  SnippetAction,
  CommandAction,
  FileAction,
} from "../actions/impl";
import { getLogger } from "../logger/logger";
import { isLCAPEnabled, isLCAPEnabledSync } from "../apis/validateLCAP";
import { isOpenedForAction } from "../apis/isOpenedForAction";

/**
 * The BasToolkit API without the **dynamically** initialized
 * `workspaceAPI` part.
 */
export const baseBasToolkitAPI: Omit<BasToolkit, "workspaceAPI"> = {
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
  performAction,
  isLCAPEnabled,
  isLCAPEnabledSync,
  isOpenedForAction,

  actions: {
    performAction,
    ExecuteAction,
    SnippetAction,
    CommandAction,
    FileAction,
  },
};
