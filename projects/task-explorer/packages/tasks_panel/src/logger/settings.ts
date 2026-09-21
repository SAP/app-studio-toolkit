import { workspace } from "vscode";
import { LogLevel } from "@vscode-logging/logger";

/**
 * Note that the values of these configuration properties must match those defined in the package.json
 */
export const TASKS_EXPLORER_ID = "vscode-tasks-explorer-tasks-panel";
export const LOGGING_LEVEL_CONFIG_PROP = `${TASKS_EXPLORER_ID}.loggingLevel`;
export const SOURCE_TRACKING_CONFIG_PROP = `${TASKS_EXPLORER_ID}.sourceLocationTracking`;

/**
 * @returns {LogLevel}
 */
export function getLoggingLevelSetting(): LogLevel {
  return workspace.getConfiguration().get(LOGGING_LEVEL_CONFIG_PROP) ?? "error";
}

/**
 * @returns {boolean}
 */
export function getSourceLocationTrackingSetting(): boolean {
  return workspace.getConfiguration().get(SOURCE_TRACKING_CONFIG_PROP) ?? false;
}
