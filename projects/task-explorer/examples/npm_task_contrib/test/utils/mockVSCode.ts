import { resolve, join } from "path";
import { ConfiguredTask, FormProperty, TaskEditorContributionAPI, TaskUserInput } from "@sap_oss/task_contrib_types";

const Module = require("module");
const originalRequire = Module.prototype.require;

export class MockConfigTask {
  constructor(
    public label: string,
    public type: string,
    public definition?: {
      script: string;
      path: string;
    },
    public scope?: {
      uri: {
        path: string;
      };
    },
  ) {}
}

export class MockVSCodeInfo {
  public static allExtensions: any[];
  public static visiblePanel = false;
  public static configTasks: Map<string, MockConfigTask[]> | undefined = new Map<string, MockConfigTask[]>();
  public static allTasks: any[] = [];
  public static fired = false;
  public static updateCalled;
  public static executeCalled = false;
  public static disposeCalled = false;
  public static disposeCallback: any;
  public static changeViewStateCallback: any;
  public static webViewCreated = 0;
  public static dialogAnswer = "";
  public static dialogCalled = false;
  public static asWebviewUriCalled = false;
  public static taskParam: any = undefined;
  public static taskProvider = new Map();
  public static fail = false;
  public static executionFailed = false;
  public static errorMsg = "";
  public static registeredCommand = new Map();
  public static treeDataProviderRegistered = false;
  public static onDidChangeConfigurationCallback: any;
  public static commandCalled = "";
}

export class MockUri {
  public path = "path";
}

export const testVscode: any = {
  WebViewPanel: {},
  commands: {
    registerCommand(command: string, callback: (...args: any[]) => any): void {
      MockVSCodeInfo.registeredCommand.set(command, callback);
    },
    executeCommand: (command: string, ...rest: any[]): any => {
      MockVSCodeInfo.commandCalled = command;
      if (command === "setContext" && rest[0] === "ext.isViewVisible") {
        MockVSCodeInfo.visiblePanel = rest[1];
      }
    },
  },
  extensions: {
    all: [],
  },
  Uri: {
    file(...args: string[]): any {
      if (args[0] === "fail") {
        throw new Error("uriError");
      }
      return { path: args[0] };
    },
  },
  workspace: {
    workspaceFolders: undefined,
    onDidChangeConfiguration: (callback: any): any => {
      MockVSCodeInfo.onDidChangeConfigurationCallback = callback;
    },
    getConfiguration: (section: string, wsFolder: MockUri): any => {
      if (wsFolder.path === "missingConfiguration") {
        return undefined;
      }

      return {
        get: (): any => {
          return MockVSCodeInfo.configTasks?.get(wsFolder.path);
        },
        update: async (section: string, value: any[], configurationTarget?: number | boolean): Promise<void> => {
          MockVSCodeInfo.updateCalled = { section, value, configurationTarget };
          MockVSCodeInfo.configTasks?.set(wsFolder.path, value);
        },
      };
    },
  },

  ConfigurationTarget: {
    WorkspaceFolder: 3,
  },
  TaskScope: {
    Global: 1,
    Workspace: 2,
  },
  Task: class {
    name: string;
    source: string;
    scope: any;

    constructor(
      public readonly definition: ConfiguredTask,
      source?: string,
      scope?: any,
    ) {
      this.name = definition.label;
      this.source = source === undefined ? definition.type : source;
      this.scope = scope;
    }
  },
  window: {
    showOpenDialog: async (options: {
      canSelectFiles: boolean;
      canSelectFolders: boolean;
      defaultUri: { path: string };
    }): Promise<{ fsPath: string }[] | undefined> => {
      MockVSCodeInfo.dialogCalled = true;
      if (options.defaultUri.path.endsWith("failDialog")) {
        throw new Error("dialog failed");
      } else if (options.defaultUri.path === "undefined") {
        return undefined;
      }
      return options.canSelectFiles
        ? [{ fsPath: join(options.defaultUri.path, "File1") }]
        : [{ fsPath: join(options.defaultUri.path, "Folder1") }];
    },
    createWebviewPanel: (): any => {
      return new MockWebViewPanel();
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- disable no-unused-vars for test scope
    registerTreeDataProvider<T>(): void {
      MockVSCodeInfo.treeDataProviderRegistered = true;
    },
    createOutputChannel() {
      return new MockOutputChannel();
    },
    showInformationMessage: async (message: string, options?: any): Promise<string> => {
      if (options !== undefined) {
        MockVSCodeInfo.dialogCalled = true;
      }
      return MockVSCodeInfo.dialogAnswer;
    },
    showErrorMessage: async (msg: string): Promise<void> => {
      MockVSCodeInfo.errorMsg = msg;
    },
    withProgress: (
      options: {
        location: number;
        title: string;
      },
      task: (progress: any, token: any) => Promise<any>,
    ) => Promise.resolve(task({}, {})),
  },
  ViewColumn: {
    One: 1,
  },
  ProgressLocation: {
    Notification: 15,
  },
  ExtensionContext: { extensionPath: "path", subscriptions: { push: (disposable) => disposable } },
  TreeItem: class {},
  EventEmitter: class {
    fire(): void {
      MockVSCodeInfo.fired = true;
    }
  },
  Webview: {
    onDidReceiveMessage: (): any => {
      return;
    },
    asWebviewUri: (): any => {
      return "aaa";
    },
  },
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
  tasks: {
    fetchTasks: async (): Promise<any> => {
      return MockVSCodeInfo.allTasks;
    },
    executeTask: async (task: any): Promise<void> => {
      MockVSCodeInfo.executeCalled = true;
      if (MockVSCodeInfo.fail) {
        MockVSCodeInfo.executionFailed = true;
        throw new Error("test");
      }
      MockVSCodeInfo.taskParam = task;
    },
    registerTaskProvider: (k, v): void => {
      MockVSCodeInfo.taskProvider.set(k, v);
    },
  },
  ShellExecution: class {
    constructor(
      public script: string,
      public options?: { cwd?: string },
    ) {}
  },
};

export const MockApi = {
  getTaskEditorContributors() {
    const contributors = new Map<string, TaskEditorContributionAPI<ConfiguredTask>>();
    const contributor = {
      async init(): Promise<void> {
        return;
      },
      convertTaskToFormProperties(): FormProperty[] {
        return [
          {
            taskProperty: "label",
            type: "input",
          },
          {
            taskProperty: "prop1",
            type: "input",
            isValid: async function (value: any): Promise<string> {
              const pass = value.length > 2;
              if (pass) {
                return "";
              }

              return "invalid value";
            },
          },
          {
            name: "prop2",
            type: "input",
          },
        ];
      },
      updateTask(task: ConfiguredTask, changes: TaskUserInput): ConfiguredTask {
        return { ...task, ...changes };
      },
      getTaskImage(): string {
        return "image";
      },
    };
    contributors.set("test-deploy", contributor);
    return contributors;
  },
};

function clearModuleCache(testModulePath?: string): void {
  if (testModulePath) {
    const key = resolve(testModulePath);
    if (require.cache[key]) {
      delete require.cache[key];
    }
  }
}

export function mockVscode(testModulePath?: string): void {
  clearModuleCache(testModulePath);

  Module.prototype.require = function (...args: any): void {
    if (args[0] === "vscode") {
      return testVscode;
    }

    return originalRequire.apply(this, args);
  };
}

export function resetTestVSCode(): void {
  testVscode.extensions.all = [];
  testVscode.workspace.workspaceFolders = undefined;
  MockVSCodeInfo.configTasks = new Map<string, MockConfigTask[]>();
  MockVSCodeInfo.allTasks = [];
  MockVSCodeInfo.updateCalled = undefined;
  MockVSCodeInfo.disposeCalled = false;
  MockVSCodeInfo.dialogCalled = false;
  MockVSCodeInfo.allExtensions = [];
  MockVSCodeInfo.visiblePanel = false;
  MockVSCodeInfo.fired = false;
  MockVSCodeInfo.webViewCreated = 0;
  MockVSCodeInfo.executeCalled = false;
  MockVSCodeInfo.asWebviewUriCalled = false;
  MockVSCodeInfo.taskParam = undefined;
  MockVSCodeInfo.taskProvider.clear();
  MockVSCodeInfo.fail = false;
  MockVSCodeInfo.errorMsg = "";
  MockVSCodeInfo.dialogAnswer = "";
  MockVSCodeInfo.registeredCommand.clear();
  MockVSCodeInfo.treeDataProviderRegistered = false;
  MockVSCodeInfo.disposeCallback = undefined;
  MockVSCodeInfo.onDidChangeConfigurationCallback = undefined;
  MockVSCodeInfo.changeViewStateCallback = undefined;
  MockVSCodeInfo.commandCalled = "";
}

export class MockWebView {
  onDidReceiveMessage: any;

  constructor() {
    MockVSCodeInfo.webViewCreated++;
    this.onDidReceiveMessage = (): any => {
      return;
    };
  }

  asWebviewUri(): any {
    MockVSCodeInfo.asWebviewUriCalled = true;
    return "aaa";
  }
}

export class MockOutputChannel {
  public appendLine() {
    return;
  }
}

export class MockWebViewPanel {
  public webview: any;
  onDidDispose: any;
  onDidChangeViewState: any;

  constructor() {
    this.webview = new MockWebView();
    this.onDidDispose = (callback: any): any => {
      MockVSCodeInfo.disposeCallback = callback;
    };
    this.onDidChangeViewState = (callback: any): any => {
      MockVSCodeInfo.changeViewStateCallback = callback;
    };
  }

  dispose(): void {
    MockVSCodeInfo.disposeCalled = true;
  }
}
