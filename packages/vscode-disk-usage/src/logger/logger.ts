import type { ExtensionContext, window } from "vscode";
import { IVSCodeExtLogger } from "@vscode-logging/types";
import { configureLogger, NOOP_LOGGER } from "@vscode-logging/wrapper";

export { getLogger, initLogger };

const LOGGING_LEVEL_CONFIG_PROP = "vscode-disk-usage.logging.level";
// this property does not exist on the extension configuration
// it is overkill for this extension...
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

/* istanbul ignore next -- never using real logger in pure unit tests */
function initLogger(opts: {
  extensionName: string;
  subscriptions: ExtensionContext["subscriptions"];
  logUri: ExtensionContext["logUri"];
  createOutputChannel: typeof window.createOutputChannel;
}): void {
  /* istanbul ignore next -- we are never using a real logger in unit tests */
  try {
    logger = configureLogger({
      extName: opts.extensionName,
      logPath: opts.logUri.fsPath,
      logOutputChannel: opts.createOutputChannel(opts.extensionName),
      loggingLevelProp: LOGGING_LEVEL_CONFIG_PROP,
      sourceLocationProp: SOURCE_TRACKING_CONFIG_PROP,
      subscriptions: opts.subscriptions,
    });
  } catch (error) /* istanbul ignore next -- this is complex to test and will give little value */ {
    console.error(
      `Logs won't be available for the ${opts.extensionName} extension: "`,
      error
    );
  }
}
