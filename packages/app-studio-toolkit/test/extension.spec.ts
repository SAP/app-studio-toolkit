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
import * as basUtils from "../src/utils/bas-utils";
import * as logger from "../src/logger/logger";
import { fail } from "assert";
import { ActionsFactory } from "../src/actions/actionsFactory";
import * as basRemoteExplorerInstance from "../src/devspace-manager/instance";
import { find, xor } from "lodash";

describe("extension unit test", () => {
  let sandbox: SinonSandbox;
  let workspaceMock: SinonMock;
  let basctlServerMock: SinonMock;
  let basUtilsMock: SinonMock;
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
    basUtilsMock = sandbox.mock(basUtils);
    performerMock = sandbox.mock(performer);
    wsConfigMock = sandbox.mock(wsConfig);
    loggerMock = sandbox.mock(logger);
    basRemoteExplorerMock = sandbox.mock(basRemoteExplorerInstance);
  });

  afterEach(() => {
    workspaceMock.verify();
    basctlServerMock.verify();
    basUtilsMock.verify();
    performerMock.verify();
    wsConfigMock.verify();
    loggerMock.verify();
    basRemoteExplorerMock.verify();
  });

  describe("package definitions", () => {
    let packageJson: {
      contributes: {
        menus: {
          commandPalette: {
            when: string;
            command: string;
          }[];
        };
      };
      extensionPack: string[];
    };

    before(() => {
      packageJson = require("../../package.json");
    });

    it("extension pack definition verifing", () => {
      expect(
        xor(packageJson.extensionPack, ["SAPOSS.app-studio-remote-access"])
      ).to.be.empty;
    });

    it("command 'local-extension.dev-space.open-in-code' is available on web only", () => {
      const command = find(packageJson.contributes.menus.commandPalette, [
        `command`,
        `local-extension.dev-space.open-in-code`,
      ]);
      expect(command).to.haveOwnProperty("when").equal("isWeb");
    });
  });

  describe("activate", () => {
    it("performs defined actions", async () => {
      const context: any = {
        subscriptions: {
          push: () => {},
        },
      };

      basRemoteExplorerMock
        .expects("initBasRemoteExplorer")
        .withExactArgs(context);
      loggerMock.expects("initLogger").withExactArgs(context);
      basUtilsMock.expects("startBasKeepAlive").returns(void 0);
      basUtilsMock.expects("shouldRunCtlServer").returns(true);
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
      await new Promise((resolve) => setTimeout(resolve, 200)); // wait for actions to be performed
    });

    it("does nothing with no actions", async () => {
      const context: any = {
        subscriptions: {
          push: () => {},
        },
      };

      loggerMock.expects("initLogger").withExactArgs(context);
      basUtilsMock.expects("startBasKeepAlive").returns(void 0);
      basUtilsMock.expects("shouldRunCtlServer").returns(false);
      performerMock.expects("_performAction").never();

      wsConfigMock.expects("get").withExactArgs("actions", []).returns([]);
      basRemoteExplorerMock
        .expects("initBasRemoteExplorer")
        .withExactArgs(context);

      const result = extension.activate(context);
      await new Promise((resolve) => setTimeout(resolve, 200)); // wait for actions to be performed
      expect(result).to.haveOwnProperty("getExtensionAPI");
      expect(result).to.haveOwnProperty("actions");
    });

    it("fails when startBasctlServer throws an error", () => {
      const context: any = {};
      const testError = new Error("Socket failure");

      loggerMock.expects("initLogger").withExactArgs(context);
      basUtilsMock.expects("startBasKeepAlive").returns(void 0);
      basUtilsMock.expects("shouldRunCtlServer").returns(true);
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
    basRemoteExplorerMock.expects("deactivateBasRemoteExplorer").resolves();
    basUtilsMock.expects("cleanKeepAliveInterval");
    extension.deactivate();
  });
});
