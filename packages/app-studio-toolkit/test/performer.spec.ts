import { expect } from "chai";
import { SinonSandbox, SinonMock, createSandbox } from "sinon";
import {
  BasAction,
  ICommandAction,
  IExecuteAction,
  IFileAction,
  ISnippetAction,
} from "@sap-devx/app-studio-toolkit-types";
import { COMMAND, SNIPPET, EXECUTE } from "../src/constants";

import { mockVscode } from "./mockUtil";

const testVscode = {
  commands: { executeCommand: () => "" },
  ViewColumn: {
    Two: 2,
  },
  Uri: {
    parse: (path: string, strict?: boolean) => {
      const parts = path.split("://");
      return { scheme: parts[0], fsPath: parts[1] };
    },
  },
};

mockVscode(testVscode, "dist/src/actions/actionsFactory.js");
mockVscode(testVscode, "dist/src/actions/performer.js");
import { _performAction } from "../src/actions/performer";
import { window } from "vscode";
import { ActionsFactory } from "../src/actions/actionsFactory";

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
      const commAction: ICommandAction = {
        actionType: COMMAND,
        name: "commandName",
        params: ["param1", "param2"],
      };
      commandsMock
        .expects("executeCommand")
        .withArgs(commAction.name, "param1", "param2")
        .resolves("success");
      expect(await _performAction(commAction)).to.be.equal("success");
    });

    it("is successful without params when executeCommand is fulfilled", async () => {
      const commAction: ICommandAction = {
        actionType: COMMAND,
        name: "commandName",
      };
      commandsMock
        .expects("executeCommand")
        .withExactArgs(commAction.name)
        .resolves("success");
      expect(await _performAction(commAction)).to.be.equal("success");
    });

    it("is successful without params when executeCommand is rejected", async () => {
      const commAction: ICommandAction = {
        actionType: COMMAND,
        name: "commandName",
        params: ["param1", "param2"],
      };
      commandsMock
        .expects("executeCommand")
        .withArgs(commAction.name, "param1", "param2")
        .rejects(new Error("Failure"));
      await expect(_performAction(commAction)).to.be.rejectedWith("Failure");
    });
  });

  describe("executeAction", () => {
    it("is successful with params", async () => {
      const execAction: IExecuteAction = {
        actionType: EXECUTE,
        executeAction: () =>
          window.showErrorMessage(`Hello from ExecuteAction`),
        params: ["param1", "param2"],
      };
      const executeActionMock = sandbox.mock(execAction);
      executeActionMock
        .expects("executeAction")
        .withExactArgs(execAction.params)
        .returns("success");
      expect(await _performAction(execAction)).to.be.equal("success");
      executeActionMock.verify();
    });
  });

  describe("fileAction", () => {
    it("is fulfilled if executeCommand is fulfilled", async () => {
      const fileJson = {
        actionType: "FILE",
        uri: "file:///home/user/projects/myproj/sourcefile.js",
      };
      const fileAction = ActionsFactory.createAction(fileJson) as IFileAction;
      commandsMock
        .expects("executeCommand")
        .withExactArgs("vscode.open", fileAction.uri, { viewColumn: 2 });
      // check that no error is thrown
      await _performAction(fileAction);
    });

    it("is rejected if executeCommand rejects", async () => {
      const fileJson = {
        actionType: "FILE",
        uri: "file:///home/user/projects/myproj/sourcefile.js",
      };
      const fileAction = ActionsFactory.createAction(fileJson) as IFileAction;
      commandsMock
        .expects("executeCommand")
        .withExactArgs("vscode.open", fileAction.uri, { viewColumn: 2 })
        .rejects(new Error("Something bad happened"));
      await expect(_performAction(fileAction)).to.be.rejectedWith(
        "Something bad happened"
      );
    });

    it("is fulfilled if executeCommand with 'external link' scheme is fulfilled", async () => {
      const fileJson = {
        actionType: "FILE",
        uri: "http:///home/user/projects/myproj/sourcefile.js",
      };
      const fileAction = ActionsFactory.createAction(fileJson) as IFileAction;
      commandsMock
        .expects("executeCommand")
        .withExactArgs("vscode.open", fileAction.uri);
      // check that no error is thrown
      await _performAction(fileAction);
    });

    it("is rejected if executeCommand  with 'external link' scheme rejects", async () => {
      const fileJson = {
        actionType: "FILE",
        uri: "https:///home/user/projects/myproj/sourcefile.js",
      };
      const fileAction = ActionsFactory.createAction(fileJson) as IFileAction;
      commandsMock
        .expects("executeCommand")
        .withExactArgs("vscode.open", fileAction.uri)
        .rejects(new Error("Something bad happened"));
      await expect(_performAction(fileAction)).to.be.rejectedWith(
        "Something bad happened"
      );
    });
  });

  describe("snippetAction", () => {
    it("is fulfilled if executeCommand is fulfilled", async () => {
      const snippetAction: ISnippetAction = {
        actionType: SNIPPET,
        contributorId: "contributor1",
        snippetName: "mySnippet",
        context: { data: "myContext" },
        isNonInteractive: true,
      };
      commandsMock.expects("executeCommand").withExactArgs("loadCodeSnippet", {
        viewColumn: 2,
        contributorId: snippetAction.contributorId,
        snippetName: snippetAction.snippetName,
        context: snippetAction.context,
        isNonInteractive: snippetAction.isNonInteractive,
      });
      // check that no error is thrown
      await _performAction(snippetAction);
    });

    it("is rejected if executeCommand rejects", async () => {
      const snippetAction: ISnippetAction = {
        actionType: SNIPPET,
        contributorId: "contributor1",
        snippetName: "mySnippet",
        context: { data: "myContext" },
      };
      commandsMock
        .expects("executeCommand")
        .withExactArgs("loadCodeSnippet", {
          viewColumn: 2,
          contributorId: snippetAction.contributorId,
          snippetName: snippetAction.snippetName,
          context: snippetAction.context,
          isNonInteractive: false,
        })
        .rejects(new Error("Something bad happened"));
      await expect(_performAction(snippetAction)).to.be.rejectedWith(
        "Something bad happened"
      );
    });
  });

  it("undefined action type is rejected", async () => {
    const action = {
      actionType: "unsupported",
    };
    const result = _performAction(action as BasAction);
    await expect(result).to.be.rejectedWith(`actionType is not supported`);
  });

  it("undefined action is rejected", async () => {
    await expect(
      _performAction(undefined as unknown as BasAction)
    ).to.be.rejectedWith(`Action is not provided`);
  });
});
