import { mockVscode } from "./mockUtil";
import { expect } from "chai";
import { SinonSandbox, SinonMock, createSandbox } from "sinon";

const wsConfig = {
  get: () => "",
  update: () => "",
};

const testVscode = {
  extensions: {
    all: [
      {
        packageJSON: {
          BASContributes: {
            actions: [
              {
                id: "abc123",
                actionType: "COMMAND",
                name: "workbench.action.openGlobalSettings",
              },
            ],
          },
        },
      },
    ],
  },
  workspace: {
    getConfiguration: () => wsConfig,
    onDidChangeWorkspaceFolders: () => {},
  },
  commands: {
    registerCommand: () => {},
  },
  TreeItem: class MockTreeItem {
    public readonly label: string;
    constructor(label?: string) {
      this.label = label || "";
    }
  },
};

mockVscode(testVscode, "dist/src/extension.js");
mockVscode(testVscode, "dist/src/actions/controller.js");
mockVscode(testVscode, "dist/src/actions/performer.js");
mockVscode(testVscode, "dist/src/actions/actionsConfig.js");
mockVscode(testVscode, "dist/src/basctlServer/basctlServer.js");
mockVscode(testVscode, "dist/src/project-type/workspace-instance.js");
mockVscode(testVscode, "dist/src/devspace-manager/instance.js");
import * as extension from "../src/extension";
import * as performer from "../src/actions/performer";
import * as basctlServer from "../src/basctlServer/basctlServer";
import * as logger from "../src/logger/logger";
import { fail } from "assert";
import { ActionsFactory } from "../src/actions/actionsFactory";
import * as basRemoteExplorerInstance from "../src/devspace-manager/instance";

describe("extension unit test", () => {
  let sandbox: SinonSandbox;
  let workspaceMock: SinonMock;
  let basctlServerMock: SinonMock;
  let performerMock: SinonMock;
  let wsConfigMock: SinonMock;
  let loggerMock: SinonMock;
  let basRemoteExplorerMock: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    workspaceMock = sandbox.mock(testVscode.workspace);
    basctlServerMock = sandbox.mock(basctlServer);
    performerMock = sandbox.mock(performer);
    wsConfigMock = sandbox.mock(wsConfig);
    loggerMock = sandbox.mock(logger);
    basRemoteExplorerMock = sandbox.mock(basRemoteExplorerInstance);
  });

  afterEach(() => {
    workspaceMock.verify();
    basctlServerMock.verify();
    performerMock.verify();
    wsConfigMock.verify();
    loggerMock.verify();
    basRemoteExplorerMock.verify();
  });

  describe("package definitions", () => {
    let packageJson: {
      contributes: {
        themes: [{ label: string; uiTheme: string; path: string }];
      };
    };

    before(() => {
      packageJson = require("../../package.json");
    });

    it("theme contribution verifying", () => {
      expect(packageJson.contributes.themes).deep.equal([
        {
          label: "SAP Fiori Quartz Light",
          uiTheme: "vs",
          path: "./src/themes/light-default-clean.json",
        },
        {
          label: "SAP Fiori Quartz Dark",
          uiTheme: "vs-dark",
          path: "./src/themes/dark-default-clean.json",
        },
        {
          label: "SAP Fiori Evening Horizon",
          uiTheme: "vs-dark",
          path: "./src/themes/dark-fiori-horizon.json",
        },
      ]);
    });
  });

  describe("activate", () => {
    it("performs defined actions", () => {
      const context: any = {
        subscriptions: {
          push: () => {},
        },
      };

      basRemoteExplorerMock
        .expects("initBasRemoteExplorer")
        .withExactArgs(context);
      loggerMock.expects("initLogger").withExactArgs(context);
      basctlServerMock.expects("startBasctlServer");
      const scheduledAction = {
        name: "actName",
        actionType: "COMMAND",
      };
      wsConfigMock
        .expects("get")
        .withExactArgs("actions", [])
        .returns([scheduledAction]);
      const action = ActionsFactory.createAction(scheduledAction, true);
      performerMock.expects("_performAction").withExactArgs(action).resolves();

      extension.activate(context);
    });

    it("does nothing with no actions", () => {
      const context: any = {
        subscriptions: {
          push: () => {},
        },
      };

      loggerMock.expects("initLogger").withExactArgs(context);
      basctlServerMock.expects("startBasctlServer");
      performerMock.expects("_performAction").never();

      wsConfigMock.expects("get").withExactArgs("actions", []).returns([]);

      const result = extension.activate(context);
      expect(result).to.haveOwnProperty("getExtensionAPI");
      expect(result).to.haveOwnProperty("actions");
    });

    it("fails when startBasctlServer throws an error", () => {
      const context: any = {};
      const testError = new Error("Socket failure");

      loggerMock.expects("initLogger").withExactArgs(context);
      basctlServerMock.expects("startBasctlServer").throws(testError);

      try {
        extension.activate(context);
        fail("test should fail");
      } catch (error) {
        expect(error.message).to.be.equal(testError.message);
      }
    });
  });

  it("deactivate", () => {
    basctlServerMock.expects("closeBasctlServer");
    extension.deactivate();
  });
});
