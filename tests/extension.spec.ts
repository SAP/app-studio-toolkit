import { mockVscode } from "./mockUtil";
import { expect } from "chai";
import { SinonSandbox, SinonMock, createSandbox } from "sinon";

const wsConfig = {
    get: () => "",
    update: () => ""
};

const testVscode = {
    extensions: {
        all: [{
            packageJSON: {
                BASContributes: {
                    actions: [{
                        id: "abc123",
                        actionType: "COMMAND",
                        name: "workbench.action.openGlobalSettings"
                    }]
                }
            }
        }]
    },
    workspace: {
        getConfiguration: () => wsConfig
    }
};

mockVscode(testVscode, "src/extension.ts");
mockVscode(testVscode, "src/actions/controller.ts");
mockVscode(testVscode, "src/actions/performer.ts");
mockVscode(testVscode, "src/basctlServer/basctlServer.ts");
import * as extension from "../src/extension";
import * as performer from '../src/actions/performer';
import * as basctlServer from '../src/basctlServer/basctlServer';
import * as logger from "../src/logger/logger";
import { fail } from "assert";

describe("extension unit test", () => {
    let sandbox: SinonSandbox;
    let workspaceMock: SinonMock;
    let basctlServerMock: SinonMock;
    let performerMock: SinonMock;
    let wsConfigMock: SinonMock;
    let loggerMock: SinonMock;

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
    });

    afterEach(() => {
        workspaceMock.verify();
        basctlServerMock.verify();
        performerMock.verify();
        wsConfigMock.verify();
        loggerMock.verify();
    });

    describe('activate', () => {
        it("performs defined actions", async () => {
            const context: any = {};

            loggerMock.expects("initLogger").withExactArgs(context);
            basctlServerMock.expects("startBasctlServer");
            workspaceMock.expects("getConfiguration").returns(wsConfig);
            const scheduledAction = {
                name: "actName",
                constructor: { name: "actConstName" }
            };
            wsConfigMock.expects("get").withExactArgs("actions", []).returns([scheduledAction]);
            performerMock.expects("_performAction").withExactArgs(scheduledAction).resolves();
            wsConfigMock.expects("update").withExactArgs("actions", []);

            await extension.activate(context);
        });

        it("does nothing with no actions", async () => {
            const context: any = {};

            loggerMock.expects("initLogger").withExactArgs(context);
            basctlServerMock.expects("startBasctlServer");
            workspaceMock.expects("getConfiguration").returns(wsConfig);
            performerMock.expects("_performAction").never();

            wsConfigMock.expects("get").withExactArgs("actions", []).returns([]);
            wsConfigMock.expects("update").withExactArgs("actions", []);

            const result = await extension.activate(context);
            expect(result).to.haveOwnProperty("getExtensionAPI");
            expect(result).to.haveOwnProperty("actions");
        });

        it("fails when startBasctlServer throws an error", async () => {
            const context: any = {};
            const testError = new Error('Socket failure');

            loggerMock.expects("initLogger").withExactArgs(context);
            basctlServerMock.expects("startBasctlServer").throws(testError);

            try {
                await extension.activate(context);
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

    context("activate with actionId as parameters in the URL", () => {
        describe('a single action', () => {
            let requireMock;
            before(() => {
                requireMock = require('mock-require');
                const configuration = { "actions": "abc123" };
                const sapPlugin = {
                    window: {
                        configuration: () => configuration
                    }
                };
                requireMock('@sap/plugin', sapPlugin);
            });
            const action = {
                id: "abc123",
                actionType: "COMMAND",
                name: "workbench.action.openGlobalSettings"
            };

            it("should call _performAction on the action", async () => {
                basctlServerMock.expects("startBasctlServer");
                performerMock.expects("_performAction").withExactArgs(action).resolves();
                const context: any = {};
                const result = await extension.activate(context);
                expect(result).to.haveOwnProperty("getExtensionAPI");
                expect(result).to.haveOwnProperty("actions");
            });
        });

        describe('action doesnt exist', () => {
            let requireMock;
            before(() => {
                requireMock = require('mock-require');
                const configuration = { "actions": "abc" };
                const sapPlugin = {
                    window: {
                        configuration: () => configuration
                    }
                };
                requireMock('@sap/plugin', sapPlugin);
            });

            it("shouldn't call _performAction", async () => {
                basctlServerMock.expects("startBasctlServer");
                performerMock.expects("_performAction").never();
                const context: any = {};
                const result = await extension.activate(context);
                expect(result).to.haveOwnProperty("getExtensionAPI");
                expect(result).to.haveOwnProperty("actions");
            });
        });

        describe('two actions param', () => {
            let requireMock;
            before(() => {
                requireMock = require('mock-require');
                const configuration = { "actions": "abc123,stam" };
                const sapPlugin = {
                    window: {
                        configuration: () => configuration
                    }
                };
                requireMock('@sap/plugin', sapPlugin);
            });

            const action = {
                id: "abc123",
                actionType: "COMMAND",
                name: "workbench.action.openGlobalSettings"
            };

            it("should call _performAction just on one action", async () => {
                basctlServerMock.expects("startBasctlServer");
                performerMock.expects("_performAction").withExactArgs(action).resolves();
                const context: any = {};
                const result = await extension.activate(context);
                expect(result).to.haveOwnProperty("getExtensionAPI");
                expect(result).to.haveOwnProperty("actions");
            });
        });
    });
});
