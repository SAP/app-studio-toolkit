import { ExtensionContext, window } from "vscode";
import { readFile as readFileCallback } from "fs";
import { resolve } from "path";
import { configureLogger, NOOP_LOGGER } from "@vscode-logging/wrapper";
import { IChildLogger, IVSCodeExtLogger } from "@vscode-logging/types";
import { promisify } from "util";
/**
 * Note that the values of these configuration properties must match those defined in the package.json
 */
const LOGGING_LEVEL_CONFIG_PROP = "CloudFoundryTools.logging.loggingLevel";
const SOURCE_TRACKING_CONFIG_PROP = "CloudFoundryTools.logging.sourceLocationTracking";

const readFile = promisify(readFileCallback);
// On file load we initialize our logger to `NOOP_LOGGER`
// this is done because the "real" logger cannot be initialized during file load.
// only once the `activate` function has been called in extension.ts
// as the `ExtensionContext` argument to `activate` contains the required `logPath`
let loggerImpel: IVSCodeExtLogger = NOOP_LOGGER;

export function getLogger(): IChildLogger {
  return loggerImpel;
}

function setLogger(newLogger: IVSCodeExtLogger): void {
  loggerImpel = newLogger;
}

export function getModuleLogger(name: string): IChildLogger {
  return getLogger().getChildLogger({ label: name });
}

export async function initLogger(context: ExtensionContext): Promise<void> {
  const meta = JSON.parse(await readFile(resolve(context.extensionPath, "package.json"), "utf8")) as {
    displayName: string;
  };

  const extLogger = configureLogger({
    extName: meta.displayName,
    logPath: context.logUri.fsPath,
    logOutputChannel: window.createOutputChannel(meta.displayName),
    // set to `true` if you also want your VSCode extension to log to the console.
    logConsole: false,
    loggingLevelProp: LOGGING_LEVEL_CONFIG_PROP,
    sourceLocationProp: SOURCE_TRACKING_CONFIG_PROP,
    subscriptions: context.subscriptions,
  });

  setLogger(extLogger);
}
