import * as proxyquire from "proxyquire";
import * as pDefer from "p-defer";
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
    workspaceFolders: [{}, {}],
    getConfiguration: () => wsConfig,
    onDidChangeWorkspaceFolders: () => {},
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

        before(() => {
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
});
