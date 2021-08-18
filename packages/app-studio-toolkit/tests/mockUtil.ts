import * as path from "path";
import * as _ from "lodash";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require("module"); 
const originalRequire = Module.prototype.require;

export const mockVscode = (oVscodeMock: any, testModulePath?: string) => {
    clearModuleCache(testModulePath);

    Module.prototype.require = function (...args: any[]) {
        if (_.get(args, "[0]") === "vscode") {
            return oVscodeMock;
        }

        return originalRequire.apply(this, args);
    };
};

export const clearModuleCache = (testModulePath?: string) => {
    if (testModulePath) {
        const key = path.resolve(testModulePath);
        if (require.cache[key]) {
            delete require.cache[key];
        }
    }
};
