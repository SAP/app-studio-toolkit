// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as mocha from "mocha";
import { getVscodeMock } from "../src/utils/vscodeProxy";

export const mockLogger: any = {
  debug: () => {},
  info: () => {},
  error: () => {},
  warn: () => {},
  trace: () => {},
  fatal: () => {},
  getChildLogger: () => mockLogger,
};

export const vscode = getVscodeMock();
