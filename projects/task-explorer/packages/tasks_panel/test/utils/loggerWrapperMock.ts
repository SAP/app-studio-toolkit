// eslint-disable-next-line eslint-comments/disable-enable-pair -- disable no-unused-vars
/* eslint-disable @typescript-eslint/no-unused-vars -- suppressed: test scope */
import * as loggerWrapper from "../../src/logger/logger-wrapper";
import { IChildLogger, IVSCodeExtLogger } from "@vscode-logging/logger";

let message: string;

export function createLoggerWrapperMock(sandbox: any): any {
  message = "";
  const loggerImpl: IVSCodeExtLogger = {
    changeLevel(newLevel: "off" | "fatal" | "error" | "warn" | "info" | "debug" | "trace"): void {
      return;
    },
    changeSourceLocationTracking(newSourceLocation: boolean): void {
      return;
    },
    fatal: (msg: string) => {
      message = msg;
    },
    error: (msg: string) => {
      message = msg;
    },
    warn: (msg: string) => {
      message = msg;
    },
    info: (msg: string) => {
      message = msg;
    },
    debug: (msg: string) => {
      message = msg;
    },
    trace: (msg: string) => {
      message = msg;
    },
    getChildLogger(opts: { label: string }): IChildLogger {
      return loggerImpl;
    },
  };

  const loggerWrapperMock = sandbox.mock(loggerWrapper);
  loggerWrapperMock.expects("getClassLogger").returns(loggerImpl).atLeast(1);
  loggerWrapperMock.expects("getLogger").returns(loggerImpl).atLeast(1);
  return loggerWrapperMock;
}

export function getLoggerMessage(): string {
  return message;
}

export function resetLoggerMessage(): void {
  message = "";
}
