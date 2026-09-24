import * as path from "path";

const Module = require("module"); // eslint-disable-line @typescript-eslint/no-var-requires -- legacy code
const originalRequire = Module.prototype.require;

export function mockVscode(
  oVscodeMock: unknown,
  testModulePath?: string
): void {
  clearModuleCache(testModulePath);

  Module.prototype.require = function (request: string) {
    if (request === "vscode") {
      return oVscodeMock;
    }

    // eslint-disable-next-line prefer-rest-params -- legacy code
    return originalRequire.apply(this, arguments);
  };
}

export function clearModuleCache(testModulePath?: string): void {
  if (testModulePath) {
    const key = path.resolve(testModulePath);
    if (require.cache[key]) {
      delete require.cache[key];
    }
  }
}
