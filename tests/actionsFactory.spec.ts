import { expect } from "chai";
import * as sinon from "sinon";
import { mockVscode } from "./mockUtil";

const testVscode = {
    Uri: { parse: () => "" }
};

mockVscode(testVscode, "src/actions/actionsFactory.ts");
mockVscode(testVscode, "src/actions/impl.ts");
import { ActionsFactory } from "../src/actions/actionsFactory";
import { CommandAction, ExecuteAction, FileAction, SnippetAction } from "../src/actions/impl";
import { window } from "vscode";

describe("actionsFactory test", () => {
    let sandbox: any;

    before(() => {
        sandbox = sinon.createSandbox();
    });

    after(() => {
        sandbox.restore();
    });

    describe("create command action", () => {
        it("suceeds with params", () => {
            const actionJson = {
                actionType: "COMMAND",
                commandName: "myCommand",
                commandParams: ["param1", "param2"]
            };
            const action = ActionsFactory.createAction(actionJson);
            expect(action instanceof CommandAction).to.be.true;
            expect((action as CommandAction).name).to.be.equal("myCommand");
            expect((action as CommandAction).params).to.deep.equal(["param1", "param2"]);
        });

        it("suceeds without params", () => {
            const actionJson = {
                actionType: "COMMAND",
                commandName: "myCommand"

            };
            const action = ActionsFactory.createAction(actionJson);
            expect(action instanceof CommandAction).to.be.true;
            expect((action as CommandAction).name).to.be.equal("myCommand");
            expect((action as CommandAction).params).to.deep.equal([]);
        });

        it("fails without name", () => {
            const actionJson = {
                actionType: "COMMAND"
            };
            expect(() => ActionsFactory.createAction(actionJson)).to.throw(`commandName is missing for actionType = COMMAND`);
        }); 
    });

    describe("create Snippet action", () => {
        it("suceeds with all the params", () => {
            const actionJson = {
                actionType: "SNIPPET",
                id: "id",
                snippetName: "name",
                contributorId: "contributorId",
                context: {},
                isNonInteractive: true
            };
            const action = ActionsFactory.createAction(actionJson);
            expect(action instanceof SnippetAction).to.be.true;
            expect((action as SnippetAction).snippetName).to.be.equal("name");
            expect((action as SnippetAction).contributorId).to.deep.equal("contributorId");
        });

        it("suceeds with just the mandatory params", () => {
            const actionJson = {
                actionType: "SNIPPET",
                snippetName: "name",
                context: {},
                contributorId: "contributorId"
            };
            const action = ActionsFactory.createAction(actionJson);
            expect(action instanceof SnippetAction).to.be.true;
            expect((action as SnippetAction).snippetName).to.be.equal("name");
            expect((action as SnippetAction).contributorId).to.deep.equal("contributorId");
        });

        it("fails without snippetName", () => {
            const actionJson = {
                actionType: "SNIPPET",
                contributorId: "contributorId",
                context: {}
            };
            expect(() => ActionsFactory.createAction(actionJson)).to.throw(`snippetName is missing for actionType = SNIPPET`);    
        });

        it("fails without contributorId", () => {
            const actionJson = {
                actionType: "SNIPPET",
                snippetName: "name",
                context: {},
            };
            expect(() => ActionsFactory.createAction(actionJson)).to.throw(`contributorId is missing for actionType = SNIPPET`);    
        });

        it("fails without context", () => {
            const actionJson = {
                actionType: "SNIPPET",
                contributorId: "contributorId",
                snippetName: "name"
            };
            expect(() => ActionsFactory.createAction(actionJson)).to.throw(`context is missing for actionType = SNIPPET`);    
        });
    });

    describe("create File action", () => {
        let uriMock: any;

        beforeEach(() => {
            uriMock = sandbox.mock(testVscode.Uri);
        });
    
        afterEach(() => {
            uriMock.verify();
        });

        it("suceeds with uri", () => {
            const myFileUri = "file:///usr/myFile";
            const actionJson = {
                actionType: "FILE",
                uri: myFileUri,
                id: "id"
            };
            uriMock.expects("parse").withExactArgs('');
            uriMock.expects("parse").withExactArgs(myFileUri, true);
            const action = ActionsFactory.createAction(actionJson);
            expect(action instanceof FileAction).to.be.true;
        });

        it("fails without uri", () => {
            const actionJson = {
                actionType: "FILE"
            };
            uriMock.expects("parse").withExactArgs('');
            uriMock.expects("parse").withExactArgs(undefined, true).throws(new Error('Failed!'));
            expect(() => ActionsFactory.createAction(actionJson)).
                to.throw(`Failed to parse field uri: undefined for actionType = FILE: Failed!`);
        });
    });

    describe("create action fails", () => {
        it("when no action type defined", () => {
            const actionJson = {};
            expect(() => ActionsFactory.createAction(actionJson)).to.throw(`actionType is missing`);
        });

        it("when no unsupported action type used", () => {
            const actionJson = {
                actionType: "Unsupported"
            };
            expect(() => ActionsFactory.createAction(actionJson)).to.throw(`Action with actionType = Unsupported could not be created from json file`);
        });
    });
    
    // TODO remove those when ExecuteAction and SnippetAction are supported in actionsFactory
    it("create executeAction", () => {
        const action = new ExecuteAction();
        action.executeAction = () => window.showErrorMessage(`Hello from ExecuteAction`);
        expect(action.actionType).to.equal("EXECUTE");
        expect(action.params).to.deep.equal([]);
    });
});
