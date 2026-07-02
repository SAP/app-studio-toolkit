import lodash from "lodash";
import { join } from "path";
import { URI } from "vscode-uri";

const { set } = lodash;

const _isInTest = process.argv.some((arg) =>
  arg.includes(join("node_modules", "mocha"))
);

const returnValue = (...args: any[]) => {
  if (_isInTest) {
    throw new Error(`tested method is not implemented ${JSON.stringify(args)}`);
  }
  return "";
};

const returnPromise = (...args: any[]) => {
  if (_isInTest) {
    throw new Error(`tested method is not implemented ${JSON.stringify(args)}`);
  }
  return Promise.resolve();
};

const configObj = { get: returnValue, update: returnValue };
const globalStateObj = { get: returnValue, update: returnValue } as any;
const context = { globalState: globalStateObj, extensionPath: "" };

const Uri = {
  file: (path?: string) => {
    return URI.file(path || "");
  },
  parse: (path?: string) => {
    return URI.parse(path || "");
  },
};

const workspace = {
  getConfiguration: () => configObj,
  updateWorkspaceFolders: returnValue,
  workspaceFolders: [Uri.file()],
  workspaceFile: Uri.file(),
};

const oRegisteredCommands = {};
const commands = {
  registerCommand: (id: string, cmd: any) => {
    set(oRegisteredCommands, id, cmd);
    return Promise.resolve(oRegisteredCommands);
  },
  executeCommand: returnPromise,
  getCommands: () => oRegisteredCommands,
};

const window = {
  setStatusBarMessage: () => {
    return {
      dispose: returnValue,
    };
  },
  showErrorMessage: returnPromise,
  showInformationMessage: returnPromise,
  showWarningMessage: returnPromise,
  withProgress: returnPromise,
  registerWebviewPanelSerializer: returnPromise,
  createWebviewPanel: returnPromise,
  showQuickPick: returnPromise,
  createOutputChannel: returnValue,
  showOpenDialog: () => {
    throw new Error("not implemented");
  },
};

const ViewColumn = {
  One: 1,
  Two: 2,
};

const ProgressLocation = {
  SourceControl: 1,
  Window: 10,
  Notification: 15,
};

const vscodeMock = {
  Uri,
  context,
  workspace,
  commands,
  window,
  ViewColumn,
  ProgressLocation,
};

export const getVscodeMock = () => vscodeMock;
