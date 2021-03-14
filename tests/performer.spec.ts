import { assert, expect } from "chai";
import * as sinon from "sinon";

import { ActionJsonKey, ActionType, IAction } from "../src/api";
import { mockVscode } from "./mockUtil";

const testVscode = {
    commands: { executeCommand: () => {} },
    ViewColumn: {
        Two: 2
    }
};

mockVscode(testVscode, "src/actions/performer.ts");
mockVscode(testVscode, "src/actions/interfaces.ts");
import { _performAction } from "../src/actions/performer";

describe("performer test", () => {
    let sandbox: any;
    let commandsMock: any;

    before(() => {
        sandbox = sinon.createSandbox();
    });

    after(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        commandsMock = sandbox.mock(testVscode.commands);
    });

    afterEach(() => {
        commandsMock.verify();
    });
    describe("commandAction", () => {
        it("is successful with params when executeCommand is fulfilled", async () => {
            const commAction = {
                actionType: ActionType.Command,
                name: "commandName",
                params: ["param1", "param2"]
            };
            commandsMock.expects("executeCommand").withExactArgs(commAction.name, commAction.params).once().resolves("success");
            expect(await _performAction(commAction)).to.be.equal("success");
        });
        it("is successful without params when executeCommand is fulfilled", async () => {
            const commAction = {
                actionType: ActionType.Command,
                name: "commandName"
            };
            commandsMock.expects("executeCommand").withExactArgs(commAction.name).once().resolves("success");
            expect(await _performAction(commAction)).to.be.equal("success");
        });
        it("is successful without params when executeCommand is rejected", async () => {
            const commAction = {
                actionType: ActionType.Command,
                name: "commandName",
                params: ["param1", "param2"]
            };
            commandsMock.expects("executeCommand").withExactArgs(commAction.name, commAction.params).once().rejects(new Error("Failure"));
            await expect(_performAction(commAction)).to.be.rejectedWith("Failure");
        });
    });
    describe("executeAction", () => {
        it("is successful with params", async () => {
            const execAction = {
                actionType: ActionType.Execute,
                executeAction: () => {},
                params: ["param1", "param2"]
            };
            let executeActionMock = sandbox.mock(execAction);
            executeActionMock.expects("executeAction").withExactArgs(execAction.params).once().returns("success");
            expect(await _performAction(execAction)).to.be.equal("success");
            executeActionMock.verify();
        });
        it("is successful without params", async () => {
            const execAction = {
                actionType: ActionType.Execute,
                executeAction: () => {}
            };
            let executeActionMock = sandbox.mock(execAction);
            executeActionMock.expects("executeAction").withExactArgs().once().returns("success");
            expect(await _performAction(execAction)).to.be.equal("success");
            executeActionMock.verify();
        });
    });
    describe("fileAction", () => {

        it("is fulfilled if executeCommand is fulfilled", async () => {
            const fileAction = {
                actionType: ActionType.File,
                uri: 'file:///home/user/projects/myproj/sourcefile.js'
            };
            commandsMock.expects("executeCommand").withExactArgs('vscode.open', fileAction.uri, {viewColumn: 2}).once();
            // check that no error is thrown
            await _performAction(fileAction);
        });
        it("is rejected if executeCommand rejects", async () => {
            const fileAction = {
                actionType: ActionType.File,
                uri: 'file:///home/user/projects/myproj/sourcefile.js'
            };
            commandsMock.expects("executeCommand").withExactArgs('vscode.open', fileAction.uri, {viewColumn: 2}).once().rejects(new Error("Something bad happened"));
            await expect(_performAction(fileAction)).to.be.rejectedWith("Something bad happened");
        });
    });
    describe("snippetAction", () => {
        it("is fulfilled if executeCommand is fulfilled", async () => {
            const snippetAction = {
                actionType: ActionType.Snippet,
                contributorId: "contributor1",
                snippetName: "mySnippet",
                context: "myContext"
            };
            commandsMock.expects("executeCommand").withExactArgs("loadCodeSnippet", { viewColumn: 2, contributorId: snippetAction.contributorId, snippetName: snippetAction.snippetName, context: snippetAction.context }).once();
            // check that no error is thrown
            await _performAction(snippetAction);
        });
        it("is rejected if executeCommand rejects", async () => {
            const snippetAction = {
                actionType: ActionType.Snippet,
                contributorId: "contributor1",
                snippetName: "mySnippet",
                context: "myContext"
            };
            commandsMock.expects("executeCommand").withExactArgs("loadCodeSnippet", { viewColumn: 2, contributorId: snippetAction.contributorId, snippetName: snippetAction.snippetName, context: snippetAction.context }).once().rejects(new Error("Something bad happened"));
            await expect(_performAction(snippetAction)).to.be.rejectedWith("Something bad happened");
        });
    });

    

    it("undefined action type is rejected", async () => {
        const action = {
            actionType: "unsupported"
        };
        const result = _performAction(action as IAction);
        await expect(result).to.be.rejectedWith(`${ActionJsonKey.ActionType}=${action.actionType} is not supported`);
    });

    it("undefined action is rejected", async () => {
        await expect(_performAction(undefined as unknown as IAction)).to.be.rejectedWith(`Action is: undefined nothing is performed`);
    });
});