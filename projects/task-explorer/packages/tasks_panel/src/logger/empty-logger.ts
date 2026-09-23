// eslint-disable-next-line eslint-comments/disable-enable-pair -- suppress no-empty-function
/* eslint-disable @typescript-eslint/no-empty-function -- empty logger for reference */
// eslint-disable-next-line eslint-comments/disable-enable-pair -- suppress no-unused-vars
/* eslint-disable @typescript-eslint/no-unused-vars -- empty logger for reference*/
import { IVSCodeExtLogger, IChildLogger } from "@vscode-logging/logger";

export const EMPTY_LOGGER: IVSCodeExtLogger = {
  changeLevel(newLevel: string): void {},
  changeSourceLocationTracking(newSourceLocation: boolean): void {},
  debug(msg: string, ...args: any[]): void {},
  error(msg: string, ...args: any[]): void {},
  fatal(msg: string, ...args: any[]): void {},
  getChildLogger(opts: { label: string }): IChildLogger {
    return this;
  },
  info(msg: string, ...args: any[]): void {},
  trace(msg: string, ...args: any[]): void {},
  warn(msg: string, ...args: any[]): void {},
};

Object.freeze(EMPTY_LOGGER);
