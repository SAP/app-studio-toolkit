import { mockVscode } from "../mockUtil";
import { expect } from "chai";
import { createSandbox, SinonMock, SinonSandbox } from "sinon";

const wsConfig = {
  get: () => "",
  update: () => "",
};

let commandParmater: string;
let callbackParmater: (
  cliCommand: string,
  ...params: string[]
) => Promise<string>;
const testVscode = {
  workspace: {
    getConfiguration: () => wsConfig,
    onDidChangeWorkspaceFolders: () => {},
  },
  commands: {
    registerCommand: (
      command: string,
      callback: (cliCommand: string, ...params: string[]) => Promise<string>
    ) => {
      commandParmater = command;
      callbackParmater = callback;
    },
  },
};

mockVscode(testVscode, "dist/src/project-type/workspace-instance.js");
import * as workspaceInstance from "../../src/project-type/workspace-instance";
import { CommandExecutor } from "@sap/artifact-management";

describe("workspace-instance unit test", () => {
  let sandbox: SinonSandbox;
  let workspaceMock: SinonMock;
  let commandExecutorMock: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    commandParmater = "";
    callbackParmater = () => Promise.resolve("");

    workspaceMock = sandbox.mock(testVscode.workspace);
    commandExecutorMock = sandbox.mock(CommandExecutor);
  });

  afterEach(() => {
    workspaceMock.verify();
    commandExecutorMock.verify();
  });

  it("run BAS command and return STRING result", async () => {
    const context: any = {
      subscriptions: {
        push: () => {},
      },
    };

    workspaceInstance.initWorkspaceAPI(context);

    expect(commandParmater).to.be.equal("project-api.command.run");

    commandExecutorMock
      .expects("execute")
      .withExactArgs("testCommand", "testProjectPath")
      .returns("testResult");
    const result = await callbackParmater("testCommand", "testProjectPath");
    expect(result.startsWith("testResult")).to.be.true;
  });

  it("run BAS command and return OBJECT result", async () => {
    const context: any = {
      subscriptions: {
        push: () => {},
      },
    };

    workspaceInstance.initWorkspaceAPI(context);

    expect(commandParmater).to.be.equal("project-api.command.run");

    commandExecutorMock
      .expects("execute")
      .withExactArgs("testCommand", "testProjectPath")
      .returns({
        result: "Result is an object",
      });
    const result = await callbackParmater("testCommand", "testProjectPath");
    expect(result.indexOf("Result is an object") >= 0).to.be.true;
  });

  it("run BAS command and no return", async () => {
    const context: any = {
      subscriptions: {
        push: () => {},
      },
    };

    workspaceInstance.initWorkspaceAPI(context);

    expect(commandParmater).to.be.equal("project-api.command.run");

    commandExecutorMock
      .expects("execute")
      .withExactArgs("testCommand", "testProjectPath");
    const result = await callbackParmater("testCommand", "testProjectPath");
    expect(!result.trim()).to.be.true;
  });

  it("unsupported command", async () => {
    const context: any = {
      subscriptions: {
        push: () => {},
      },
    };

    workspaceInstance.initWorkspaceAPI(context);

    expect(commandParmater).to.be.equal("project-api.command.run");

    commandExecutorMock
      .expects("execute")
      .withExactArgs("unsupportedCommand", "testProjectPath")
      .throws(new Error("Unsupported command"));
    const result = await callbackParmater(
      "unsupportedCommand",
      "testProjectPath"
    );
    expect(result.indexOf("Unsupported command") >= 0).to.be.true;
  });
});
