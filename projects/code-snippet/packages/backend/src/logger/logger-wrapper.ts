import * as vscode from "vscode"; // NOSONAR
import {
  getExtensionLogger,
  getExtensionLoggerOpts,
  IChildLogger,
  IVSCodeExtLogger,
  LogLevel,
} from "@vscode-logging/logger";
import {
  listenToLogSettingsChanges,
  logLoggerDetails,
} from "./settings-changes-handler";
// import {resolve} from "path";
import {
  getLoggingLevelSetting,
  getSourceLocationTrackingSetting,
} from "./settings";

// const PACKAGE_JSON = "package.json";
const CODE_SNIPPET_LOGGER_NAME = "codeSnippet";
const WEBVIEW_RPC_LOGGER_NAME = "webviewRpc";
const CODE_SNIPPET = "Code Snippet";

/**
 * A Simple Wrapper to hold the state of our "singleton" (per extension) IVSCodeExtLogger
 * implementation.
 */

export const ERROR_LOGGER_NOT_INITIALIZED =
  "Logger has not yet been initialized!";

/**
 * @type {IVSCodeExtLogger}
 */
let logger: any;

function isInitialized(): boolean {
  return logger !== undefined ? true : false;
}

/**
 * Note the use of a getter function so the value would be lazy resolved on each use.
 * This enables concise and simple consumption of the Logger throughout our Extension.
 *
 * @returns { IVSCodeExtLogger }
 */
export function getLogger(): IVSCodeExtLogger {
  if (isInitialized() === false) {
    throw Error(ERROR_LOGGER_NOT_INITIALIZED);
  }
  return logger;
}

export function getClassLogger(className: string): IChildLogger {
  return getLogger().getChildLogger({ label: className });
}

export function getCodeSnippetLibraryLogger(): IChildLogger {
  return getLibraryLogger(CODE_SNIPPET_LOGGER_NAME);
}

export function getWebviewRpcLibraryLogger(): IChildLogger {
  return getLibraryLogger(WEBVIEW_RPC_LOGGER_NAME);
}

function getLibraryLogger(libraryName: string): IChildLogger {
  return getLogger().getChildLogger({ label: libraryName });
}

export function getConsoleWarnLogger(): IChildLogger {
  const consoleLog = (msg: string, ...args: any[]): void => {
    console.log(msg, args);
  };
  // eslint-disable-next-line @typescript-eslint/no-empty-function -- intentional
  const noopLog = () => {};
  const warningLogger = {
    fatal: consoleLog,
    error: consoleLog,
    warn: consoleLog,
    info: noopLog,
    debug: noopLog,
    trace: noopLog,
    getChildLogger: () => {
      return warningLogger;
    },
  };
  return warningLogger;
}

export function createExtensionLoggerAndSubscribeToLogSettingsChanges(
  context: vscode.ExtensionContext
): void {
  createExtensionLogger(context);
  // Subscribe to Logger settings changes.
  listenToLogSettingsChanges(context);
}

/**
 * This function should be invoked after the Logger has been initialized in the Extension's `activate` function.
 * @param {IVSCodeExtLogger} newLogger
 */
function initLoggerWrapper(newLogger: any) {
  logger = newLogger;
}

function createExtensionLogger(context: vscode.ExtensionContext) {
  const contextLogPath = context.logPath;
  const logLevelSetting: LogLevel = getLoggingLevelSetting();
  const sourceLocationTrackingSettings: boolean = getSourceLocationTrackingSetting();
  const logOutputChannel = vscode.window.createOutputChannel(CODE_SNIPPET);

  //TODO:  const meta = require(resolve(context.extensionPath, PACKAGE_JSON));
  const extensionLoggerOpts: getExtensionLoggerOpts = {
    extName: CODE_SNIPPET,
    level: logLevelSetting,
    logPath: contextLogPath,
    logOutputChannel: logOutputChannel,
    sourceLocationTracking: sourceLocationTrackingSettings,
    logConsole: true,
  };

  // The Logger must first be initialized before any logging commands may be invoked.
  const extensionLogger = getExtensionLogger(extensionLoggerOpts);
  // Update the logger-wrapper with a reference to the extLogger.
  initLoggerWrapper(extensionLogger);
  logLoggerDetails(context, logLevelSetting);
}
