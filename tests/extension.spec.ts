import { mockVscode } from "./mockUtil";
import { expect, assert } from "chai";
import * as _ from "lodash";
import * as sinon from "sinon";

const workspaceConfig = {};
const testVscode = {
    extensions: {
        all: [{
            packageJSON: {
                BASContributes: {
                    actions: [{
                        id : "abc123",
                        actionType : "COMMAND",
                        name : "workbench.action.openGlobalSettings"
                    }]
                },
            }
        }]
    },
    workspace: {
        getConfiguration: () => workspaceConfig
    }
};

mockVscode(testVscode, "src/extension.ts");
mockVscode(testVscode, "src/actions/controller.ts");
mockVscode(testVscode, "src/actions/performer.ts");
mockVscode(testVscode, "src/basctlServer/basctlServer.ts");
import * as extension from "../src/extension";
import * as performer from '../src/actions/performer';
import * as basctlServer from '../src/basctlServer/basctlServer';
import { ActionType } from "../src/actions/interfaces";

describe("extension unit test", () => {
    let sandbox: any;
    let workspaceMock: any;
    let basctlServerMock: any;
    let performerMock: any;

    before(() => {
        sandbox = sinon.createSandbox();
    });

    after(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        workspaceMock = sandbox.mock(testVscode.workspace);
        basctlServerMock = sandbox.mock(basctlServer);
        performerMock = sandbox.mock(performer);
    });

    afterEach(() => {
        workspaceMock.verify();
        basctlServerMock.verify();
        performerMock.verify();
    });

    describe('activate', () => {
        it("performs defined actions", async () => {
            const action = {actionType: ActionType.Execute};
            const actionSettingsGet = sandbox.spy(() => [action]);
            const actionSettingsUpdate = sandbox.spy();
            _.set(workspaceConfig, "get", actionSettingsGet);
            _.set(workspaceConfig, "update", actionSettingsUpdate);
            basctlServerMock.expects("startBasctlServer").once().returns();
            workspaceMock.expects("getConfiguration").once().returns(workspaceConfig);
            performerMock.expects("_performAction").withExactArgs(action).resolves();
            const result = await extension.activate();
            expect(result).to.haveOwnProperty("getExtensionAPI");
            expect(result).to.haveOwnProperty("actions");
            assert(actionSettingsGet.calledWith("actions"))
            assert(actionSettingsUpdate.calledWith("actions", []))
        });

        it("does nothing with no actions", async () => {
            const actionSettingsGet = sandbox.spy(() => []);
            const actionSettingsUpdate = sandbox.spy();
            _.set(workspaceConfig, "get", actionSettingsGet);
            _.set(workspaceConfig, "update", actionSettingsUpdate);
            basctlServerMock.expects("startBasctlServer").once().returns();
            workspaceMock.expects("getConfiguration").once().returns(workspaceConfig);
            performerMock.expects("_performAction").never();
            const result = await extension.activate();
            expect(result).to.haveOwnProperty("getExtensionAPI");
            expect(result).to.haveOwnProperty("actions");
            assert(actionSettingsGet.calledWith("actions"));
            assert(actionSettingsUpdate.notCalled);
        });

        it("fails when startBasctlServer throws an error", async () => {
            const error = new Error('Socket failure');
            basctlServerMock.expects("startBasctlServer").throws(error);
            await expect(extension.activate()).to.be.rejectedWith(error);
        });

    });

    it("deactivate", () => {
        basctlServerMock.expects("closeBasctlServer").once().returns();
        extension.deactivate();
    });

    context("activate with actionId as parameters in the URL", () => {
        describe('a single action', () => {
            let requireMock;        
            before(() => {
                requireMock = require('mock-require');
                const configuration = {"action": "abc123"};
                const sapPlugin = {
                    window: {
                        configuration: () => configuration
                    }
                };
                requireMock('@sap/plugin', sapPlugin);
            })
            const action = {
                id : "abc123",
                actionType : "COMMAND",
                name : "workbench.action.openGlobalSettings"
            }

            it("should call _performAction on the action", async () => {
                basctlServerMock.expects("startBasctlServer").once().returns();
                performerMock.expects("_performAction").withExactArgs(action).resolves();
                const result = await extension.activate();
                expect(result).to.haveOwnProperty("getExtensionAPI");
                expect(result).to.haveOwnProperty("actions");
            });
        });

        describe('action doesnt exist', () => {
            let requireMock;        
            before(() => {
                requireMock = require('mock-require');
                const configuration = {"action": "abc"};
                const sapPlugin = {
                    window: {
                        configuration: () => configuration
                    }
                };
                requireMock('@sap/plugin', sapPlugin);
            })
            const action = {
                id : "abc123",
                actionType : "COMMAND",
                name : "workbench.action.openGlobalSettings"
            }

            it("shouldn't call _performAction", async () => {
                basctlServerMock.expects("startBasctlServer").once().returns();
                performerMock.expects("_performAction").never();
                const result = await extension.activate();
                expect(result).to.haveOwnProperty("getExtensionAPI");
                expect(result).to.haveOwnProperty("actions");
            });
        });
    });

});
