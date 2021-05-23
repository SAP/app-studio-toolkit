import { expect } from "chai";
import { SinonSandbox, SinonMock, createSandbox } from "sinon";
import { ActionJsonKey, ActionType } from "../src/api";
import { IAction } from "@sap-devx/app-studio-toolkit-types";

import { mockVscode } from "./mockUtil";

const testVscode = {
    commands: { executeCommand: () => "" },
    ViewColumn: {
        Two: 2
    }
};

mockVscode(testVscode, "src/actions/performer.ts");
mockVscode(testVscode, "src/actions/interfaces.ts");
import { _performAction } from "../src/actions/performer";

describe("performer test", () => {
    let sandbox: SinonSandbox;
    let commandsMock: SinonMock;

    before(() => {
        sandbox = createSandbox();
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
            commandsMock.expects("executeCommand").withExactArgs(commAction.name, commAction.params).resolves("success");
            expect(await _performAction(commAction)).to.be.equal("success");
        });

        it("is successful without params when executeCommand is fulfilled", async () => {
            const commAction = {
                actionType: ActionType.Command,
                name: "commandName"
            };
            commandsMock.expects("executeCommand").withExactArgs(commAction.name, []).resolves("success");
            expect(await _performAction(commAction)).to.be.equal("success");
        });

        it("is successful without params when executeCommand is rejected", async () => {
            const commAction = {
                actionType: ActionType.Command,
                name: "commandName",
                params: ["param1", "param2"]
            };
            commandsMock.expects("executeCommand").withExactArgs(commAction.name, commAction.params).rejects(new Error("Failure"));
            await expect(_performAction(commAction)).to.be.rejectedWith("Failure");
        });
    });

    describe("executeAction", () => {
        it("is successful with params", async () => {
            const execAction = {
                actionType: ActionType.Execute,
                executeAction: () => "",
                params: ["param1", "param2"]
            };
            const executeActionMock = sandbox.mock(execAction);
            executeActionMock.expects("executeAction").withExactArgs(execAction.params).returns("success");
            expect(await _performAction(execAction)).to.be.equal("success");
            executeActionMock.verify();
        });

        it("is successful without params", async () => {
            const execAction = {
                actionType: ActionType.Execute,
                executeAction: () => "success"
            };

            expect(await _performAction(execAction)).to.be.equal("success");

        });
    });

    describe("fileAction", () => {
        it("is fulfilled if executeCommand is fulfilled", async () => {
            const fileAction = {
                actionType: ActionType.File,
                uri: 'file:///home/user/projects/myproj/sourcefile.js'
            };
            commandsMock.expects("executeCommand").withExactArgs('vscode.open', fileAction.uri, {viewColumn: 2});
            // check that no error is thrown
            await _performAction(fileAction);
        });

        it("is rejected if executeCommand rejects", async () => {
            const fileAction = {
                actionType: ActionType.File,
                uri: 'file:///home/user/projects/myproj/sourcefile.js'
            };
            commandsMock.expects("executeCommand").withExactArgs('vscode.open', fileAction.uri, {viewColumn: 2}).rejects(new Error("Something bad happened"));
            await expect(_performAction(fileAction)).to.be.rejectedWith("Something bad happened");
        });
    });

    describe("snippetAction", () => {
        it("is fulfilled if executeCommand is fulfilled", async () => {
            const snippetAction = {
                actionType: ActionType.Snippet,
                contributorId: "contributor1",
                snippetName: "mySnippet",
                context: "myContext",
                isNonInteractive: true
            };
            commandsMock.expects("executeCommand").withExactArgs("loadCodeSnippet", {
                viewColumn: 2,
                contributorId: snippetAction.contributorId,
                snippetName: snippetAction.snippetName,
                context: snippetAction.context,
                isNonInteractive: snippetAction.isNonInteractive });
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
            commandsMock.expects("executeCommand").withExactArgs("loadCodeSnippet", {
                viewColumn: 2,
                contributorId: snippetAction.contributorId,
                snippetName: snippetAction.snippetName,
                context: snippetAction.context,
                isNonInteractive: false }).rejects(new Error("Something bad happened"));
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
        await expect(_performAction(undefined as unknown as IAction)).to.be.rejectedWith(`Action is not provided`);
    });
});
