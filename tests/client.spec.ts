import { assert, expect } from "chai";
import * as sinon from "sinon";
import { mockVscode } from "./mockUtil";

const testVscode = {
    ConfigurationTarget: {
        Workspace: 2
    },
    workspace: {
        getConfiguration: () => {}
    }
};

mockVscode(testVscode, "src/actions/client.ts");
mockVscode(testVscode, "src/actions/performer.ts");
import { performAction } from "../src/actions/client"
import * as performer from '../src/actions/performer';
import { ActionType, IAction } from "../src/api";
import { ExecuteAction } from "../src/actions/impl";

describe("client test", () => {
    let sandbox: any;
    let workspaceMock: any;
    let performerMock: any;
    let logSpy: any;

    before(() => {
        sandbox = sinon.createSandbox();
        logSpy = sandbox.spy(console, 'error');
    });

    after(() => {
        sandbox.restore();
    });

    describe("perform action", () => {
        it("performs the action without schedule", () => {
            performerMock = sandbox.mock(performer);
            let myAction = {
                actionType: ActionType.Command,
                name: "myAction",
            };
            performerMock.expects("_performAction").withExactArgs(myAction).once();
            performAction(myAction);
            performerMock.verify();
        });
        it("schedules the action with schedule (existing action list, update successful)", () => {
            workspaceMock = sandbox.mock(testVscode.workspace);
            
            let myAction = {
                actionType: ActionType.Command,
                name: "myAction",
            };
            let config = {
                get: () => {},
                update: () => {}
            }
            let actions: any[] = [myAction, myAction];
            let configMock = sandbox.mock(config);
            workspaceMock.expects("getConfiguration").once().returns(config);
            configMock.expects("get").withExactArgs("actions").once().returns(actions);
            configMock.expects("update").withExactArgs("actions", [myAction, myAction, myAction], 2).resolves()
            performAction(myAction, { schedule: true});
            assert(logSpy.neverCalledWith("Couldn't schedule action"));
            workspaceMock.verify();
            configMock.verify();
        });
        it("schedules the action with schedule (empy action list, update successful)", () => {
            workspaceMock = sandbox.mock(testVscode.workspace);
            let myAction = {
                actionType: ActionType.Command,
                name: "myAction",
            };
            let config = {
                get: () => {},
                update: () => {}
            }
            let configMock = sandbox.mock(config);
            workspaceMock.expects("getConfiguration").once().returns(config);
            configMock.expects("get").withExactArgs("actions").once().returns(undefined);
            configMock.expects("update").withExactArgs("actions", [myAction], 2).resolves()
            performAction(myAction, { schedule: true});
            assert(logSpy.neverCalledWith("Couldn't schedule action"));
            workspaceMock.verify();
            configMock.verify();
        });

        it("schedules the action with schedule (existing action list, update rejected)", async () => {
            workspaceMock = sandbox.mock(testVscode.workspace);
            
            let myAction = {
                actionType: ActionType.Command,
                name: "myAction",
            };
            let config = {
                get: () => {},
                update: () => {}
            }
            let actions: any[] = [myAction, myAction];
            let configMock = sandbox.mock(config);
            workspaceMock.expects("getConfiguration").once().returns(config);
            configMock.expects("get").withExactArgs("actions").once().returns(actions);
            configMock.expects("update").withExactArgs("actions", [myAction, myAction, myAction], 2).rejects("Reasons!")
            await performAction(myAction, { schedule: true});
            assert(logSpy.calledWith("Couldn't schedule action: Reasons!"), "Expected log entry was not written");
            workspaceMock.verify();
            configMock.verify();
            
        });
    });

});