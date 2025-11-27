import proxyquire from "proxyquire";
import pDefer from "p-defer";
import { expect } from "chai";
import { mockVscode } from "./mockUtil";
import { SinonSandbox, SinonMock, createSandbox } from "sinon";
import { set } from "lodash";
import { BasAction } from "@sap-devx/app-studio-toolkit-types";
import { IChildLogger } from "@vscode-logging/types";

const wsConfig = {
  get: () => [
    {
      id: "create",
      actionType: "CREATE",
      name: "create",
    },
    "create",
  ],
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
                id: "openSettingsAction",
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
    workspaceFolders: [{ uri: "folder1" }, { uri: "folder2" }],
    getConfiguration: () => wsConfig,
    onDidChangeWorkspaceFolders: () => {},
    onDidChangeConfiguration: () => ({ dispose: () => {} }),
  },
  Disposable: {
    from: (...disposables: any[]) => ({
      dispose: () => {
        disposables.forEach((d: any) => {
          if (d.dispose) {
            d.dispose();
          }
        });
      },
    }),
  },
  Uri: {
    parse: (uri: string) => ({ toString: () => uri }),
  },
};
mockVscode(testVscode, "dist/src/actions/controller.js");
mockVscode(testVscode, "dist/src/actions/performer.js");
mockVscode(testVscode, "dist/src/actions/actionsConfig.js");
import { ActionsController } from "../src/actions/controller";
import { ActionsFactory } from "../src/actions/actionsFactory";
import * as performer from "../src/actions/performer";
import * as basctlServer from "../src/basctlServer/basctlServer";

describe("controller unit test", () => {
  let sandbox: SinonSandbox;
  let basctlServerMock: SinonMock;
  let performerMock: SinonMock;
  let workspaceMock: SinonMock;
  let extensionsMock: SinonMock;
  let loggerMock: any;
  let actionsFactoryMock: any;

  const testLogger = {
    getChildLogger: () => ({} as IChildLogger),
  };

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
    extensionsMock = sandbox.mock(testVscode.extensions);
    loggerMock = sandbox.mock(testLogger);
    actionsFactoryMock = sandbox.mock(ActionsFactory);
  });

  afterEach(() => {
    workspaceMock.verify();
    basctlServerMock.verify();
    performerMock.verify();
    extensionsMock.verify();
    loggerMock.verify();
    actionsFactoryMock.verify();
  });

  describe("loadContributedActions", () => {
    let requireMock;
    before(() => {
      requireMock = require("mock-require");
      const configuration = { actions: "openSettingsAction,stam" };
      const sapPlugin = {
        window: {
          configuration: () => configuration,
        },
      };
      requireMock("@sap/plugin", sapPlugin);
    });
    const action = {
      id: "openSettingsAction",
      actionType: "COMMAND",
      name: "workbench.action.openGlobalSettings",
    };

    it("one of the two actions exists", () => {
      ActionsController.loadContributedActions();
      const result = ActionsController.getAction("openSettingsAction");

      expect(ActionsController["actions"].length).to.be.equal(1);
      expect(result).to.includes(action);
    });

    it("action doesnt exist", () => {
      ActionsController.loadContributedActions();
      const result = ActionsController.getAction("abc");

      expect(result).to.be.undefined;
    });

    it("throw error", () => {
      const api = {
        packageJSON: {
          BASContributes: {
            actions: [
              {
                id: "create",
                actionType: "CREATE",
                name: "create",
              },
            ],
          },
        },
      };
      set(testVscode, "extensions.all", [api]);
      const testError = new Error(
        `Failed to create action ${JSON.stringify(
          api.packageJSON.BASContributes.actions[0]
        )}`
      );
      try {
        ActionsController.loadContributedActions();
      } catch (error) {
        expect(error).to.be.equal(testError);
      }
    });
  });

  describe("performAction", () => {
    context("byIDs", () => {
      context("performActionsFromURL()", () => {
        let actionCtrlProxy: typeof ActionsController;
        let performActionArgsPromise: Promise<BasAction>;
        let requireMock;

        before(() => {
          requireMock = require("mock-require");
          const configuration = { actions: "openSettingsAction,stam" };
          const sapPlugin = {
            window: {
              configuration: () => configuration,
            },
          };
          requireMock("@sap/plugin", sapPlugin);

          const performActionDeferred = pDefer<BasAction>();
          performActionArgsPromise = performActionDeferred.promise;

          const proxyControllerModule = proxyquire(
            "../src/actions/controller",
            {
              "../apis/parameters": {
                getParameter() {
                  // by "ids" structure (no array)
                  return "openSettingsAction";
                },
              },
              "./performer": {
                _performAction(action: BasAction) {
                  performActionDeferred.resolve(action);
                },
              },
              vscode: {
                extensions: {
                  all: [
                    {
                      packageJSON: {
                        BASContributes: {
                          actions: [
                            {
                              // `id` matches `getParameter()` result above
                              id: "openSettingsAction",
                              actionType: "COMMAND",
                              name: "workbench.action.openGlobalSettings",
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
                "@noCallThru": true,
              },
            }
          );

          actionCtrlProxy = proxyControllerModule.ActionsController;
          actionCtrlProxy.loadContributedActions();
        });

        it("performActionsFromURL call to performFullActions bamba", async () => {
          const expectedAction = ActionsFactory.createAction(
            {
              name: "workbench.action.openGlobalSettings",
              actionType: "COMMAND",
              id: "openSettingsAction",
            },
            true
          );

          await actionCtrlProxy.performActionsFromURL();
          await expect(performActionArgsPromise).to.eventually.deep.equal(
            expectedAction
          );
        });
      });

      it("throw error", () => {
        const api = {
          packageJSON: {
            BASContributes: {
              actions: [
                {
                  id: "create",
                  actionType: "CREATE",
                  name: "create",
                },
              ],
            },
          },
        };
        const testError = new Error(
          `Failed to execute scheduled action ${JSON.stringify(
            api.packageJSON.BASContributes.actions[0]
          )}`
        );
        try {
          ActionsController.performScheduledActions();
        } catch (error) {
          expect(error).to.be.equal(testError);
        }
      });
    });
  });

  context("inlined", () => {
    context("performActionsFromURL()", () => {
      let actionCtrlProxy: typeof ActionsController;
      let performActionArgsPromise: Promise<BasAction>;

      before(() => {
        const performActionDeferred = pDefer<BasAction>();
        performActionArgsPromise = performActionDeferred.promise;

        const proxyControllerModule = proxyquire("../src/actions/controller", {
          "../apis/parameters": {
            getParameter() {
              // **inlined** json structured
              return '[{"actionType":"COMMAND","name":"workbench.action.openSettings"}]';
            },
          },
          "./performer": {
            _performAction(action: BasAction) {
              performActionDeferred.resolve(action);
            },
          },
          vscode: { ...testVscode, "@noCallThru": true },
        });

        actionCtrlProxy = proxyControllerModule.ActionsController;
      });

      it("performActionsFromURL call to perfomFullActions", async () => {
        const expectedAction = ActionsFactory.createAction(
          { actionType: "COMMAND", name: "workbench.action.openSettings" },
          true
        );

        await actionCtrlProxy.performActionsFromURL();
        await expect(performActionArgsPromise).to.eventually.deep.equal(
          expectedAction
        );
      });
    });

    it("_performAction should be called", () => {
      const action = ActionsFactory.createAction(
        { actionType: "FILE", uri: "https://www.google.com/" },
        true
      );

      performerMock.expects("_performAction").withExactArgs(action).resolves();
      ActionsController["perfomInlinedActions"](
        '[{"actionType":"FILE","uri":"https://www.google.com/"}]'
      );
    });

    it("error should be thrown", () => {
      const testError = new Error(`Failed to create action`);
      try {
        ActionsController["perfomInlinedActions"](
          '[{"actionType":"STAM","uri":"https://www.google.com/"}]'
        );
      } catch (error) {
        expect(error).to.be.equal(testError);
      }
    });
  });

  describe("performScheduledActions", () => {
    let actionsConfigMock: any;
    const actionsConfig = require("../src/actions/actionsConfig");

    beforeEach(() => {
      actionsConfigMock = sandbox.mock(actionsConfig);
    });

    afterEach(() => {
      actionsConfigMock.verify();
    });

    it("should perform actions with string id", () => {
      const actionId = "openSettingsAction";
      const action = ActionsFactory.createAction(
        {
          id: actionId,
          actionType: "COMMAND",
          name: "workbench.action.openGlobalSettings",
        },
        true
      );

      ActionsController["actions"].push(action);

      actionsConfigMock.expects("get").returns([actionId]);
      actionsConfigMock.expects("clear").once();
      performerMock.expects("_performAction").withExactArgs(action).resolves();

      ActionsController.performScheduledActions();
    });

    it("should perform actions with action object", () => {
      const actionObj = {
        actionType: "COMMAND",
        name: "workbench.action.openSettings",
      };
      const action = ActionsFactory.createAction(actionObj, true);

      actionsConfigMock.expects("get").returns([actionObj]);
      actionsConfigMock.expects("clear").once();
      performerMock.expects("_performAction").withExactArgs(action).resolves();

      ActionsController.performScheduledActions();
    });

    it("should skip undefined actions", () => {
      actionsConfigMock.expects("get").returns(["nonExistentAction"]);
      actionsConfigMock.expects("clear").once();
      performerMock.expects("_performAction").never();

      ActionsController.performScheduledActions();
    });

    it("should handle errors during action execution", () => {
      const actionObj = {
        actionType: "COMMAND",
        name: "workbench.action.openSettings",
      };

      actionsConfigMock.expects("get").returns([actionObj]);
      actionsConfigMock.expects("clear").once();

      ActionsController.performScheduledActions();
    });

    it("should not perform action when action creation returns null", () => {
      const invalidActionObj = {
        actionType: "INVALID",
        name: "invalid.action",
      };

      actionsConfigMock.expects("get").returns([invalidActionObj]);
      actionsConfigMock.expects("clear").once();
      performerMock.expects("_performAction").never();

      ActionsController.performScheduledActions();
    });
  });

  describe("performImmediateActions", () => {
    let disposable: any;
    let actionsConfigMock: any;
    const actionsConfig = require("../src/actions/actionsConfig");

    beforeEach(() => {
      actionsConfigMock = sandbox.mock(actionsConfig);
    });

    afterEach(() => {
      if (disposable && typeof disposable.dispose === "function") {
        try {
          disposable.dispose();
        } catch (e) {
          // Ignore disposal errors in tests
        }
      }
      disposable = undefined;
      if (actionsConfigMock) {
        actionsConfigMock.verify();
      }
    });

    it("should return a Disposable", () => {
      disposable = ActionsController.performImmediateActions();
      expect(disposable).to.have.property("dispose");
      expect(typeof disposable.dispose).to.equal("function");
    });

    it("should register configuration change listeners", () => {
      const onDidChangeConfigStub = sandbox
        .stub()
        .returns({ dispose: () => {} });
      (testVscode.workspace as any).onDidChangeConfiguration =
        onDidChangeConfigStub;

      disposable = ActionsController.performImmediateActions();

      // Should be called for each workspace folder + 1 for global
      expect(onDidChangeConfigStub.callCount).to.be.greaterThan(0);
    });

    it("should execute immediate actions when configuration changes", async () => {
      const handlers: any[] = [];
      const onDidChangeConfigStub = sandbox.stub().callsFake((handler: any) => {
        handlers.push(handler);
        return { dispose: () => {} };
      });
      (testVscode.workspace as any).onDidChangeConfiguration =
        onDidChangeConfigStub;

      const immediateAction = {
        actionType: "COMMAND",
        name: "workbench.action.openSettings",
        execute: "immediate",
      };
      const action = ActionsFactory.createAction(immediateAction, true);

      actionsConfigMock.expects("get").returns([immediateAction]);
      actionsConfigMock.expects("clear").withExactArgs(true).once();
      performerMock.expects("_performAction").withExactArgs(action).resolves();

      disposable = ActionsController.performImmediateActions();

      // Simulate configuration change on the last handler (global config)
      const mockEvent = {
        affectsConfiguration: (key: string, uri?: any) => key === "actions",
      };

      if (handlers.length > 0) {
        await handlers[handlers.length - 1](mockEvent);
        // Wait a bit for async execution to complete
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    });

    it("should not execute actions when configuration change does not affect actions key", async () => {
      const handlers: any[] = [];
      const onDidChangeConfigStub = sandbox.stub().callsFake((handler: any) => {
        handlers.push(handler);
        return { dispose: () => {} };
      });
      (testVscode.workspace as any).onDidChangeConfiguration =
        onDidChangeConfigStub;

      actionsConfigMock.expects("get").never();
      actionsConfigMock.expects("clear").never();
      performerMock.expects("_performAction").never();

      disposable = ActionsController.performImmediateActions();

      // Simulate configuration change for a different key (not "actions")
      const mockEvent = {
        affectsConfiguration: (key: string, uri?: any) =>
          key === "someOtherKey",
      };

      if (handlers.length > 0) {
        await handlers[handlers.length - 1](mockEvent);
        // Wait a bit to ensure nothing is executed
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    });

    it("should handle when workspaceFolders is undefined", async () => {
      const handlers: any[] = [];
      const onDidChangeConfigStub = sandbox.stub().callsFake((handler: any) => {
        handlers.push(handler);
        return { dispose: () => {} };
      });
      (testVscode.workspace as any).onDidChangeConfiguration =
        onDidChangeConfigStub;

      // Temporarily set workspaceFolders to undefined
      const originalFolders = testVscode.workspace.workspaceFolders;
      (testVscode.workspace as any).workspaceFolders = undefined;

      const immediateAction = {
        actionType: "COMMAND",
        name: "workbench.action.openSettings",
        execute: "immediate",
      };
      const action = ActionsFactory.createAction(immediateAction, true);

      actionsConfigMock.expects("get").returns([immediateAction]);
      actionsConfigMock.expects("clear").withExactArgs(true).once();
      performerMock.expects("_performAction").withExactArgs(action).resolves();

      disposable = ActionsController.performImmediateActions();

      // Should only register the global handler (no folder handlers)
      expect(handlers.length).to.equal(1);

      // Simulate configuration change on the global handler
      const mockEvent = {
        affectsConfiguration: (key: string, uri?: any) => key === "actions",
      };

      await handlers[0](mockEvent);
      // Wait a bit for async execution to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Restore original folders
      (testVscode.workspace as any).workspaceFolders = originalFolders;
    });
  });

  describe("executeImmediateActions", () => {
    let actionsConfigMock: any;
    const actionsConfig = require("../src/actions/actionsConfig");

    beforeEach(() => {
      actionsConfigMock = sandbox.mock(actionsConfig);
      ActionsController["isExecutingImmediateActions"] = false;
    });

    afterEach(() => {
      actionsConfigMock.verify();
      ActionsController["isExecutingImmediateActions"] = false;
    });

    it("should execute immediate actions", async () => {
      const immediateAction = {
        actionType: "COMMAND",
        name: "workbench.action.openSettings",
        execute: "immediate",
      };
      const action = ActionsFactory.createAction(immediateAction, true);

      actionsConfigMock.expects("get").returns([immediateAction]);
      actionsConfigMock.expects("clear").withExactArgs(true).once();
      performerMock.expects("_performAction").withExactArgs(action).resolves();

      await ActionsController["executeImmediateActions"]();
    });

    it("should skip non-immediate actions", async () => {
      const scheduledAction = {
        actionType: "COMMAND",
        name: "workbench.action.openSettings",
        execute: "scheduled",
      };

      actionsConfigMock.expects("get").returns([scheduledAction]);
      actionsConfigMock.expects("clear").never();
      performerMock.expects("_performAction").never();

      await ActionsController["executeImmediateActions"]();
    });

    it("should skip string actions", async () => {
      actionsConfigMock.expects("get").returns(["someActionId"]);
      actionsConfigMock.expects("clear").never();
      performerMock.expects("_performAction").never();

      await ActionsController["executeImmediateActions"]();
    });

    it("should skip actions without execute property", async () => {
      const actionWithoutExecute = {
        actionType: "COMMAND",
        name: "workbench.action.openSettings",
      };

      actionsConfigMock.expects("get").returns([actionWithoutExecute]);
      actionsConfigMock.expects("clear").never();
      performerMock.expects("_performAction").never();

      await ActionsController["executeImmediateActions"]();
    });

    it("should skip null or undefined items in actions list", async () => {
      const immediateAction = {
        actionType: "COMMAND",
        name: "workbench.action.openSettings",
        execute: "immediate",
      };
      const action = ActionsFactory.createAction(immediateAction, true);

      actionsConfigMock
        .expects("get")
        .returns([null, immediateAction, undefined]);
      actionsConfigMock.expects("clear").withExactArgs(true).once();
      performerMock.expects("_performAction").withExactArgs(action).resolves();

      await ActionsController["executeImmediateActions"]();
    });

    it("should return early if already executing", async () => {
      ActionsController["isExecutingImmediateActions"] = true;

      actionsConfigMock.expects("get").never();
      actionsConfigMock.expects("clear").never();
      performerMock.expects("_performAction").never();

      await ActionsController["executeImmediateActions"]();
    });

    it("should reset flag even on error", async () => {
      const immediateAction = {
        actionType: "COMMAND",
        name: "workbench.action.openSettings",
        execute: "immediate",
      };

      actionsConfigMock.expects("get").returns([immediateAction]);
      actionsConfigMock.expects("clear").withExactArgs(true).once();
      performerMock.expects("_performAction").rejects(new Error("Test error"));

      await ActionsController["executeImmediateActions"]();

      expect(ActionsController["isExecutingImmediateActions"]).to.be.false;
    });

    it("should return early when no immediate actions exist", async () => {
      actionsConfigMock.expects("get").returns([]);
      actionsConfigMock.expects("clear").never();
      performerMock.expects("_performAction").never();

      await ActionsController["executeImmediateActions"]();
    });
  });

  describe("detectActionMode", () => {
    it("should detect Inlined mode for valid JSON array", () => {
      const inlinedParam = '[{"actionType":"COMMAND","name":"test"}]';
      const result = ActionsController["detectActionMode"](inlinedParam);
      expect(result).to.equal("Inlined");
    });

    it("should detect ByIDs mode for non-JSON string", () => {
      const byIdsParam = "action1,action2";
      const result = ActionsController["detectActionMode"](byIdsParam);
      expect(result).to.equal("ByIDs");
    });

    it("should detect ByIDs mode for JSON object (not array)", () => {
      const objectParam = '{"actionType":"COMMAND"}';
      const result = ActionsController["detectActionMode"](objectParam);
      expect(result).to.equal("ByIDs");
    });

    it("should detect ByIDs mode for invalid JSON", () => {
      const invalidParam = "not-valid-json";
      const result = ActionsController["detectActionMode"](invalidParam);
      expect(result).to.equal("ByIDs");
    });
  });

  describe("performActionsByIds", () => {
    beforeEach(() => {
      ActionsController["actions"].length = 0;
    });

    it("should perform actions by IDs", () => {
      const action = ActionsFactory.createAction(
        {
          id: "testAction",
          actionType: "COMMAND",
          name: "test.command",
        },
        true
      );
      ActionsController["actions"].push(action);

      performerMock.expects("_performAction").withExactArgs(action).resolves();

      ActionsController["performActionsByIds"](["testAction"]);
    });

    it("should trim action IDs", () => {
      const action = ActionsFactory.createAction(
        {
          id: "testAction",
          actionType: "COMMAND",
          name: "test.command",
        },
        true
      );
      ActionsController["actions"].push(action);

      performerMock.expects("_performAction").withExactArgs(action).resolves();

      ActionsController["performActionsByIds"](["  testAction  "]);
    });

    it("should skip non-existent actions", () => {
      performerMock.expects("_performAction").never();

      ActionsController["performActionsByIds"](["nonExistent"]);
    });
  });
});
