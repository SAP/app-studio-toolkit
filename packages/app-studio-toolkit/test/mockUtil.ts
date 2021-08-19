import * as path from "path";
import * as _ from "lodash";

const Module = require("module");
const originalRequire = Module.prototype.require;

export const mockVscode = (oVscodeMock: any, testModulePath?: string) => {
  clearModuleCache(testModulePath);

  Module.prototype.require = function (...args: any[]) {
    if (_.get(args, "[0]") === "vscode") {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- dynamic import wrapper code
      return oVscodeMock;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- dynamic import wrapper code
    return originalRequire.apply(this, args);
  };
};

export function clearModuleCache(testModulePath?: string): void {
  if (testModulePath) {
    const key = path.resolve(testModulePath);
    if (require.cache[key]) {
      delete require.cache[key];
    }
  }
}
