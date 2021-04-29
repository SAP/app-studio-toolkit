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
                        actionType: "command",
                        command: "workbench.action.openGlobalSettings"
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
                constructor: {name: "actConstName"}
            };
            wsConfigMock.expects("get").withExactArgs("actions").returns([scheduledAction]);
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
            wsConfigMock.expects("get").withExactArgs("actions").returns([]);
            wsConfigMock.expects("update").withExactArgs("actions", []);

            await extension.activate(context);
        });

        it("fails when startBasctlServer throws an error", async () => {
            const context: any = {};
            const error = new Error('Socket failure');

            loggerMock.expects("initLogger").withExactArgs(context);
            basctlServerMock.expects("startBasctlServer").throws(error);

            await expect(extension.activate(context)).to.be.rejectedWith(error);
        });
    });

    it("deactivate", () => {
        basctlServerMock.expects("closeBasctlServer");
        extension.deactivate();
    });
});
