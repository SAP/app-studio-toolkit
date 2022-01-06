import { ExtensionContext, OutputChannel, window } from "vscode";
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

/* istanbul ignore next - ignoring "legacy" missing coverage to enforce all new code to be 100% */
export function initLogger(
  context: ExtensionContext,
  outputChannel: OutputChannel
): void {
  const extensionName = context.extension.id; // If the extension name changes, change this too
  try {
    logger = configureLogger({
      extName: extensionName,
      logPath: context.logPath,
      logOutputChannel: outputChannel,
      loggingLevelProp: LOGGING_LEVEL_CONFIG_PROP,
      sourceLocationProp: SOURCE_TRACKING_CONFIG_PROP,
      subscriptions: context.subscriptions,
    });
  } catch (error) /* istanbul ignore next -- this is complex to test and will give little value */ {
    console.error(
      `Logs won't be available for the ${extensionName} extension: "`,
      error.message
    );
  }
}
