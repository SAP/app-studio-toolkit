import * as path from "path";
import { dropRight, join, size, split } from "lodash";
import { existsSync } from "fs";

const Module = require("module"); // eslint-disable-line @typescript-eslint/no-var-requires
const originalRequire = Module.prototype.require;

export function clearModuleCache(testModulePath?: string): void {
  if (testModulePath) {
    const key = path.resolve(__dirname, "..", testModulePath);
    if (require.cache[key]) {
      delete require.cache[key];
    }
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function mockVscode(oVscodeMock: any, testModulePath?: string): void {
  clearModuleCache(testModulePath);

  Module.prototype.require = function (request: any) {
    if (request === "vscode") {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return oVscodeMock;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return originalRequire.apply(this, arguments);
  };
}

export function recognisePackageJsonPath(cwd?: string): string | undefined {
  let parts = split(cwd || __dirname, path.sep);
  while (size(parts)) {
    if (existsSync(path.resolve(path.join(...parts, "package.json")))) {
      return join(parts, path.sep);
    }
    parts = dropRight(parts);
  }
}
