// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as mocha from "mocha";
import { getVscodeMock } from "../src/utils/vscodeProxy";
import { createRequire } from "module";

const _require = createRequire(import.meta.url);
const Module = _require("module");
const originalRequire = Module.prototype.require;

const mockVscode = () => {
  Module.prototype.require = function (request: any) {
    if (request === "vscode") {
      return getVscodeMock();
    }

    return originalRequire.apply(this, arguments);
  };
};

mockVscode();
export const vscode = getVscodeMock();
