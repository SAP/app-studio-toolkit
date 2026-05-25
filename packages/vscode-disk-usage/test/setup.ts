const Module = require("module");
const originalRequire = Module.prototype.require;

// TODO: document
const emptyVSCode = {
  workspace: {},
};

function mockVscode() {
  Module.prototype.require = function (...args: any[]) {
    if (args[0] === "vscode") {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- dynamic import wrapper code
      return emptyVSCode;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- dynamic import wrapper code
    return originalRequire.apply(this, args);
  };
}

mockVscode();
