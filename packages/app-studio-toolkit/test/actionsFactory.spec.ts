import { expect } from "chai";
import * as sinon from "sinon";
import { mockVscode } from "./mockUtil";

const testVscode = {
  Uri: { parse: () => "" },
};

mockVscode(testVscode, "dist/src/actions/actionsFactory.js");
mockVscode(testVscode, "dist/src/actions/impl.js");
import { ActionsFactory } from "../src/actions/actionsFactory";
import {
  ICommandAction,
  ISnippetAction,
} from "@sap-devx/app-studio-toolkit-types";
import { ExecuteAction } from "../src/actions/impl";
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
        commandParams: ["param1", "param2"],
      };
      const action = ActionsFactory.createAction(actionJson);
      expect((action as ICommandAction).name).to.be.equal("myCommand");
      expect((action as ICommandAction).params).to.deep.equal([
        "param1",
        "param2",
      ]);
    });

    it("suceeds without params", () => {
      const actionJson = {
        actionType: "COMMAND",
        commandName: "myCommand",
      };
      const action = ActionsFactory.createAction(actionJson);
      expect((action as ICommandAction).name).to.be.equal("myCommand");
      expect((action as ICommandAction).params).to.deep.equal([]);
    });

    it("fails without name", () => {
      const actionJson = {
        actionType: "COMMAND",
      };
      expect(() => ActionsFactory.createAction(actionJson)).to.throw(
        `commandName is missing for "COMMAND" actionType`
      );
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
        isNonInteractive: true,
      };
      const action = ActionsFactory.createAction(actionJson);
      expect((action as ISnippetAction).snippetName).to.be.equal("name");
      expect((action as ISnippetAction).contributorId).to.deep.equal(
        "contributorId"
      );
    });

    it("suceeds with just the mandatory params", () => {
      const actionJson = {
        actionType: "SNIPPET",
        snippetName: "name",
        context: {},
        contributorId: "contributorId",
      };
      const action = ActionsFactory.createAction(actionJson);
      expect((action as ISnippetAction).snippetName).to.be.equal("name");
      expect((action as ISnippetAction).contributorId).to.deep.equal(
        "contributorId"
      );
    });

    it("fails without snippetName", () => {
      const actionJson = {
        actionType: "SNIPPET",
        contributorId: "contributorId",
        context: {},
      };
      expect(() => ActionsFactory.createAction(actionJson)).to.throw(
        `snippetName is missing for "SNIPPET" actionType`
      );
    });

    it("fails without contributorId", () => {
      const actionJson = {
        actionType: "SNIPPET",
        snippetName: "name",
        context: {},
      };
      expect(() => ActionsFactory.createAction(actionJson)).to.throw(
        `contributorId is missing for "SNIPPET" actionType`
      );
    });

    it("fails without context", () => {
      const actionJson = {
        actionType: "SNIPPET",
        contributorId: "contributorId",
        snippetName: "name",
      };
      expect(() => ActionsFactory.createAction(actionJson)).to.throw(
        `context is missing for "SNIPPET" actionType`
      );
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

    it("suceeds with uri, still with FILE actionType", () => {
      const myFileUri = "file:///usr/myFile";
      const actionJson = {
        actionType: "FILE",
        uri: myFileUri,
        id: "id",
      };
      uriMock.expects("parse").withExactArgs("");
      uriMock.expects("parse").withExactArgs(myFileUri, true);
      ActionsFactory.createAction(actionJson);
    });

    it("suceeds with uri", () => {
      const myFileUri = "file:///usr/myFile";
      const actionJson = {
        actionType: "URI",
        uri: myFileUri,
        id: "id",
      };
      uriMock.expects("parse").withExactArgs("");
      uriMock.expects("parse").withExactArgs(myFileUri, true);
      ActionsFactory.createAction(actionJson);
    });

    it("fails without uri", () => {
      const actionJson = {
        actionType: "URI",
      };
      uriMock.expects("parse").withExactArgs("");
      uriMock
        .expects("parse")
        .withExactArgs(undefined, true)
        .throws(new Error("Failed!"));
      expect(() => ActionsFactory.createAction(actionJson)).to.throw(
        `Failed to parse field uri: undefined for "URI" actionType: Failed!`
      );
    });
  });

  describe("create action fails", () => {
    it("when no action type defined", () => {
      const actionJson = {};
      expect(() => ActionsFactory.createAction(actionJson)).to.throw(
        `actionType is missing`
      );
    });

    it("when no unsupported action type used", () => {
      const actionJson = {
        actionType: "Unsupported",
      };
      expect(() => ActionsFactory.createAction(actionJson)).to.throw(
        `Action with type "Unsupported" could not be created from json file`
      );
    });
  });

  it("create executeAction", () => {
    const action = new ExecuteAction();
    action.executeAction = () =>
      window.showErrorMessage(`Hello from ExecuteAction`);
    expect(action.actionType).to.equal("EXECUTE");
    expect(action.params).to.deep.equal([]);
  });
});
