import { expect } from "chai";
import * as sinon from "sinon";
import { mockVscode } from "./mockUtil";

const testVscode = {
    Uri: { parse: () => "" }
};

mockVscode(testVscode, "src/actions/actionsFactory.ts");
mockVscode(testVscode, "src/actions/impl.ts");
mockVscode(testVscode, "src/actions/interfaces.ts");
import { ActionsFactory } from "../src/actions/actionsFactory";
import { CommandAction, ExecuteAction, FileAction, SnippetAction } from "../src/actions/impl";
import { ActionType, ActionJsonKey } from '../src/actions/interfaces';


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
                [ActionJsonKey.ActionType]: ActionType.Command,
                [ActionJsonKey.CommandName]: "myCommand",
                [ActionJsonKey.CommandParams]: ["param1", "param2"]
            };
            const action = ActionsFactory.createAction(actionJson);
            expect(action instanceof CommandAction).to.be.true;
            expect((action as CommandAction).name).to.be.equal("myCommand");
            expect((action as CommandAction).params).to.deep.equal(["param1", "param2"]);
        });

        it("suceeds without params", () => {
            const actionJson = {
                [ActionJsonKey.ActionType]: ActionType.Command,
                [ActionJsonKey.CommandName]: "myCommand"

            };
            const action = ActionsFactory.createAction(actionJson);
            expect(action instanceof CommandAction).to.be.true;
            expect((action as CommandAction).name).to.be.equal("myCommand");
            expect((action as CommandAction).params).to.deep.equal([]);
        });

        it("fails without name", () => {
            const actionJson = {
                [ActionJsonKey.ActionType]: ActionType.Command
            };
            expect(() => ActionsFactory.createAction(actionJson)).to.throw(`${ActionJsonKey.CommandName} is missing for actionType=${ActionType.Command}`);
        }); 
    });

    describe("create Snippet action", () => {
        it("suceeds with all the mandatory params", () => {
            const actionJson = {
                [ActionJsonKey.ActionType]: ActionType.Snippet,
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
                [ActionJsonKey.ActionType]: ActionType.Snippet,
                snippetName: "name",
                contributorId: "contributorId"
            };
            const action = ActionsFactory.createAction(actionJson);
            expect(action instanceof SnippetAction).to.be.true;
            expect((action as SnippetAction).snippetName).to.be.equal("name");
            expect((action as SnippetAction).contributorId).to.deep.equal("contributorId");
        });

        it("fails without snippetName", () => {
            const actionJson = {
                [ActionJsonKey.ActionType]: ActionType.Snippet,
                contributorId: "contributorId"
            };
            expect(() => ActionsFactory.createAction(actionJson)).to.throw(`snippetName is missing for actionType=${ActionType.Snippet}`);    
        });

        it("fails without contributorId", () => {
            const actionJson = {
                [ActionJsonKey.ActionType]: ActionType.Snippet,
                snippetName: "name"
            };
            expect(() => ActionsFactory.createAction(actionJson)).to.throw(`contributorId is missing for actionType=${ActionType.Snippet}`);    
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
                [ActionJsonKey.ActionType]: ActionType.File,
                [ActionJsonKey.Uri]: myFileUri,
                id: "id"
            };
            uriMock.expects("parse").withExactArgs('');
            uriMock.expects("parse").withExactArgs(myFileUri, true);
            const action = ActionsFactory.createAction(actionJson);
            expect(action instanceof FileAction).to.be.true;
        });

        it("fails without uri", () => {
            const actionJson = {
                [ActionJsonKey.ActionType]: ActionType.File
            };
            uriMock.expects("parse").withExactArgs('');
            uriMock.expects("parse").withExactArgs(undefined, true).throws(new Error('Failed!'));
            expect(() => ActionsFactory.createAction(actionJson)).
                to.throw(`Failed to parse field ${ActionJsonKey.Uri}: undefined for actionType=${ActionType.File}: Failed!`);
        });
    });

    describe("create action fails", () => {
        it("when no action type defined", () => {
            const actionJson = {};
            expect(() => ActionsFactory.createAction(actionJson)).to.throw(`${ActionJsonKey.ActionType} is missing`);
        });

        it("when no unsupported action type used", () => {
            const actionJson = {
                [ActionJsonKey.ActionType]: "Unsupported"
            };
            expect(() => ActionsFactory.createAction(actionJson)).to.throw(`Action with ${ActionJsonKey.ActionType}=Unsupported could not be created from json file`);
        });
    });
    
    // TODO remove those when ExecuteAction and SnippetAction are supported in actionsFactory
    it("create executeAction", () => {
        const action = new ExecuteAction();
        expect(action.actionType).to.equal(ActionType.Execute);
        expect(action.params).to.deep.equal([]);
    });
});
