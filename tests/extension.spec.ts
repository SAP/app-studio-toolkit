import { mockVscode } from "./mockUtil";
import { expect } from "chai";
import * as _ from "lodash";
import * as sinon from "sinon";

const oRegisteredCommands = {};
const workspaceConfig = {};
const testVscode = {
    workspace: {
        getConfiguration: () => workspaceConfig
    },
    commands: {
        registerCommand: (id: string, cmd: any) => { _.set(oRegisteredCommands, id, cmd); return Promise.resolve(oRegisteredCommands); },
        executeCommand: () => Promise.resolve()
    },
    window: {
        registerWebviewPanelSerializer: () => true
    }
};

mockVscode(testVscode, "src/extension.ts");
mockVscode(testVscode, "src/actions/performer.ts");
mockVscode(testVscode, "src/actions/basctlServer.ts");
import * as extension from "../src/extension";
import * as performer from '../src/actions/performer';
import * as basctlServer from '../src/actions/basctlServer';
import { ActionType } from "../src/actions/interfaces";

describe("extension unit test", () => {
    let sandbox: any;
    let commandsMock: any;
    let windowMock: any;
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
        commandsMock = sandbox.mock(testVscode.commands);
        windowMock = sandbox.mock(testVscode.window);
        workspaceMock = sandbox.mock(testVscode.workspace);
        basctlServerMock = sandbox.mock(basctlServer);
        performerMock = sandbox.mock(performer);
    });

    afterEach(() => {
        commandsMock.verify();
        windowMock.verify();
        workspaceMock.verify();
        basctlServerMock.verify();
        performerMock.verify();
    });

    describe('activate', () => {
        it("performs defined actions", async () => {
            let action = {actionType: ActionType.Execute};
            _.set(workspaceConfig, "actions", [action]);
            _.set(workspaceConfig, "get", () => [action]);
            basctlServerMock.expects("startBasctlServer");
            performerMock.expects("_performAction").withExactArgs(action).resolves();
            extension.activate();
        });

        it("fails when startBasctlServer throws an error", async () => {
            let error = new Error('Socket failure');
            basctlServerMock.expects("startBasctlServer").throws(error);
            extension.activate();
            // expect(() => extension.activate()).to.throw(error);
        });

    });

    it("deactivate", () => {
        extension.activate();
        extension.deactivate();
    });

});