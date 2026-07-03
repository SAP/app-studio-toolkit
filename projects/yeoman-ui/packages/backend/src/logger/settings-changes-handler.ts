import type { ExtensionContext } from "vscode";
import { vscode } from "../utils/vscodeProxy.js";
import { getLogger } from "./logger-wrapper.js";
import {
  LOGGING_LEVEL_CONFIG_PROP,
  SOURCE_TRACKING_CONFIG_PROP,
} from "./settings.js";
import type { LogLevel } from "@vscode-logging/logger";

export function logLoggerDetails(
  context: ExtensionContext,
  configLogLevel: string
): void {
  getLogger().info(`Start Logging in Log Level: <${configLogLevel}>`);
  getLogger().info(
    `Full Logs can be found in the <${context.logPath}> folder.`
  );
}

/**
 * @param {ExtensionContext} context
 */
export function listenToLogSettingsChanges(context: ExtensionContext) {
  // To enable dynamic logging level we must listen to VSCode configuration changes
  // on our `loggingLevelConfigProp` configuration setting.
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(LOGGING_LEVEL_CONFIG_PROP)) {
        const logLevel: LogLevel = vscode.workspace
          .getConfiguration()
          .get(LOGGING_LEVEL_CONFIG_PROP);

        getLogger().changeLevel(logLevel);
        logLoggerDetails(context, logLevel);
      }
    })
  );

  // Enable responding to changes in the sourceLocationTracking setting
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(SOURCE_TRACKING_CONFIG_PROP)) {
        const newSourceLocationTracking: boolean = vscode.workspace
          .getConfiguration()
          .get(SOURCE_TRACKING_CONFIG_PROP);

        getLogger().changeSourceLocationTracking(newSourceLocationTracking);
      }
    })
  );
}
