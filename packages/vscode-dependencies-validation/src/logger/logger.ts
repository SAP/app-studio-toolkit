import type { ExtensionContext, OutputChannel } from "vscode";
import { IVSCodeExtLogger } from "@vscode-logging/types";
import { configureLogger, NOOP_LOGGER } from "@vscode-logging/wrapper";

export const LOGGING_LEVEL_CONFIG_PROP = "dependenciesValidation.logging.level";
export const SOURCE_TRACKING_CONFIG_PROP =
  "dependenciesValidation.logging.sourceLocationTracking";

let logger: IVSCodeExtLogger = NOOP_LOGGER;

/**
 * Note the use of a getter function so the value would be lazy resolved on each use.
 * This enables concise and simple consumption of the Logger throughout our extension.
 */
export function getLogger(): IVSCodeExtLogger {
  return logger;
}

export function initLogger(
  context: ExtensionContext,
  outputChannel: OutputChannel,
  extensionName: string
): void {
  try {
    logger = configureLogger({
      extName: extensionName,
      logPath: context.logPath,
      logOutputChannel: outputChannel,
      loggingLevelProp: LOGGING_LEVEL_CONFIG_PROP,
      sourceLocationProp: SOURCE_TRACKING_CONFIG_PROP,
      subscriptions: context.subscriptions,
    });
  } catch (error) {
    console.error(
      `Logs won't be available for the ${extensionName} extension: "`,
      error.message
    );
  }
}
