import { expect } from "chai";
import * as sinon from "sinon";
import { mockVscode } from "./mockUtil";

const testVscode = {
    Uri: { parse: (value?: string, strict?: boolean) => {} }
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
            let actionJson = {
                [ActionJsonKey.ActionType]: ActionType.Command,
                [ActionJsonKey.CommandName]: "myCommand",
                [ActionJsonKey.CommandParams]: ["param1", "param2"]

            };
            let action = ActionsFactory.createAction(actionJson);
            expect(action instanceof CommandAction).to.be.true;
            expect((action as CommandAction).name).to.be.equal("myCommand");
            expect((action as CommandAction).params).to.be.deep.equal(["param1", "param2"]);
        });

        it("suceeds without params", () => {
            let actionJson = {
                [ActionJsonKey.ActionType]: ActionType.Command,
                [ActionJsonKey.CommandName]: "myCommand"

            };
            let action = ActionsFactory.createAction(actionJson);
            expect(action instanceof CommandAction).to.be.true;
            expect((action as CommandAction).name).to.be.equal("myCommand");
            expect((action as CommandAction).params).to.be.deep.equal([]);
        });

        it("fails without name", () => {
            let actionJson = {
                [ActionJsonKey.ActionType]: ActionType.Command
            };
            expect(() => ActionsFactory.createAction(actionJson)).to.throw(`${ActionJsonKey.CommandName} is missing for actionType=${ActionType.Command}`);
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
            let myFileUri = "file:///usr/myFile";
            let actionJson = {
                [ActionJsonKey.ActionType]: ActionType.File,
                [ActionJsonKey.Uri]: myFileUri

            };
            uriMock.expects("parse").withExactArgs('').once();
            uriMock.expects("parse").withExactArgs(myFileUri, true).once();
            let action = ActionsFactory.createAction(actionJson);
            expect(action instanceof FileAction).to.be.true;
        });

        it("fails without uri", () => {
            let actionJson = {
                [ActionJsonKey.ActionType]: ActionType.File
            };
            uriMock.expects("parse").withExactArgs('').once();
            uriMock.expects("parse").withExactArgs(undefined, true).once().throws(new Error('Failed!'));
            expect(() => ActionsFactory.createAction(actionJson)).to.throw(`Failed to parse field ${ActionJsonKey.Uri}: undefined for actionType=${ActionType.File}: Failed!`)
        });
    });

    describe("create action fails", () => {

        it("when no action type defined", () => {
            let actionJson = {};
            expect(() => ActionsFactory.createAction(actionJson)).to.throw(`${ActionJsonKey.ActionType} is missing`);
        });

        it("when no unsupported action type used", () => {
            let actionJson = {
                [ActionJsonKey.ActionType]: "Unsupported"
            };
            expect(() => ActionsFactory.createAction(actionJson)).to.throw(`${ActionJsonKey.ActionType}=Unsupported is not supported`);
        });
    });
    


    // TODO remove those when ExecuteAction and SnippetAction are supported in actionsFactory
    it("create executeAction", () => {
        const action = new ExecuteAction()
        expect(action.actionType).to.equal(ActionType.Execute);
        expect(action.params).to.deep.equal([]);
    });

    it("create executeAction", () => {
        const action = new SnippetAction()
        expect(action.actionType).to.equal(ActionType.Snippet);
        expect(action.contributorId).to.equal("");
        expect(action.snippetName).to.equal("");
        expect(action.context).to.equal("");
    });

});