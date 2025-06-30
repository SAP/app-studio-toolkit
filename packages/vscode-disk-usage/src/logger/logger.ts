import { ExtensionContext, window } from "vscode";
import { IVSCodeExtLogger } from "@vscode-logging/types";
import { configureLogger, NOOP_LOGGER } from "@vscode-logging/wrapper";

export { getLogger, initLogger };

// TODO: can we use: "context.extension.id" instead of hardcoding the extension name?
const LOGGING_LEVEL_CONFIG_PROP = "vscode-disk-usage.logging.level";
// TODO: define this configuration property
const SOURCE_TRACKING_CONFIG_PROP =
  "vscode-disk-usage.logging.sourceLocationTracking";

let logger: IVSCodeExtLogger = NOOP_LOGGER;

/**
 * Note the use of a getter function so the value would be lazy resolved on each use.
 * This enables concise and simple consumption of the Logger throughout our extension.
 */
function getLogger(): IVSCodeExtLogger {
  return logger;
}

function initLogger(context: ExtensionContext): void {
  const extensionName = context.extension.id;
  try {
    logger = configureLogger({
      extName: extensionName,
      logPath: context.logUri.fsPath,
      logOutputChannel: window.createOutputChannel(extensionName),
      loggingLevelProp: LOGGING_LEVEL_CONFIG_PROP,
      sourceLocationProp: SOURCE_TRACKING_CONFIG_PROP,
      subscriptions: context.subscriptions,
    });
  } catch (error) /* istanbul ignore next -- this is complex to test and will give little value */ {
    console.error(
      `Logs won't be available for the ${extensionName} extension: "`,
      error
    );
  }
}
