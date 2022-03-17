import type { ExtensionContext, OutputChannel } from "vscode";
import { IVSCodeExtLogger } from "@vscode-logging/types";
import { configureLogger, NOOP_LOGGER } from "@vscode-logging/wrapper";
import { CONFIG_PROPS_AND_FULL_NAME } from "./settings";

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
      loggingLevelProp: CONFIG_PROPS_AND_FULL_NAME.LOGGING_LEVEL,
      sourceLocationProp: CONFIG_PROPS_AND_FULL_NAME.SOURCE_TRACKING,
      subscriptions: context.subscriptions,
    });
  } catch (error) {
    console.error(
      `Logs won't be available for the ${extensionName} extension: "`,
      error.message
    );
  }
}
