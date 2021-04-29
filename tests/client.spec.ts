import { assert } from "chai";
import { SinonSandbox, SinonMock, createSandbox, SinonSpy } from "sinon";
import { mockVscode } from "./mockUtil";

const testVscode = {
    ConfigurationTarget: {
        Workspace: 2
    },
    workspace: {
        getConfiguration: () => ""
    }
};

mockVscode(testVscode, "src/actions/client.ts");
mockVscode(testVscode, "src/actions/performer.ts");
import { performAction } from "../src/actions/client";
import * as performer from '../src/actions/performer';
import { ActionType } from "../src/api";

describe("client test", () => {
    let sandbox: SinonSandbox;
    let workspaceMock: SinonMock;
    let performerMock: SinonMock;
    let logSpy: SinonSpy;
    let configMock: SinonMock;

    const config = {
        get: () => "",
        update: () => ""
    };

    const myAction = {
        actionType: ActionType.Command,
        name: "myAction"
    };

    before(() => {
        sandbox = createSandbox();
        logSpy = sandbox.spy(console, 'error');
    });

    after(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        performerMock = sandbox.mock(performer);
        workspaceMock = sandbox.mock(testVscode.workspace);
        configMock = sandbox.mock(config);
    });

    afterEach(() => {
        performerMock.verify();
        workspaceMock.verify();
        configMock.verify();
    });

    describe("perform action", () => {
        it("performs the action without schedule", async () => {
            performerMock.expects("_performAction").withExactArgs(myAction);
            await performAction(myAction);
        });
        it("schedules the action with schedule (existing action list, update successful)", async () => {
            const actions: any[] = [myAction, myAction];
            workspaceMock.expects("getConfiguration").returns(config);
            configMock.expects("get").withExactArgs("actions").returns(actions);
            configMock.expects("update").withExactArgs("actions", [myAction, myAction, myAction], 2).resolves();
            await performAction(myAction, { schedule: true});
            assert(logSpy.neverCalledWith("Couldn't schedule action"));
        });
        it("schedules the action with schedule (empy action list, update successful)", async () => {
            workspaceMock.expects("getConfiguration").returns(config);
            configMock.expects("get").withExactArgs("actions").returns(undefined);
            configMock.expects("update").withExactArgs("actions", [myAction], 2).resolves();
            await performAction(myAction, { schedule: true});
            assert(logSpy.neverCalledWith("Couldn't schedule action"));
        });

        it("schedules the action with schedule (existing action list, update rejected)", async () => {
            const actions: any[] = [myAction, myAction];
            workspaceMock.expects("getConfiguration").returns(config);
            configMock.expects("get").withExactArgs("actions").returns(actions);
            configMock.expects("update").withExactArgs("actions", [myAction, myAction, myAction], 2).rejects("Reasons!");
            await performAction(myAction, { schedule: true});
            assert(logSpy.calledWith("Couldn't schedule action: Reasons!"), "Expected log entry was not written");
        });
    });
});
