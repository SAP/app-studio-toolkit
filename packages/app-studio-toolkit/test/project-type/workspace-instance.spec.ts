import { mockVscode } from "../mockUtil";
import { ok } from "assert";
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

    ok(commandParmater === "project-api.command.run");

    commandExecutorMock
      .expects("execute")
      .withExactArgs("testCommand", "testProjectPath")
      .returns("testResult");
    const result = await callbackParmater("testCommand", "testProjectPath");
    ok(result.startsWith("testResult"));
  });

  it("run BAS command and return OBJECT result", async () => {
    const context: any = {
      subscriptions: {
        push: () => {},
      },
    };

    workspaceInstance.initWorkspaceAPI(context);

    ok(commandParmater === "project-api.command.run");

    commandExecutorMock
      .expects("execute")
      .withExactArgs("testCommand", "testProjectPath")
      .returns({
        result: "Result is an object",
      });
    const result = await callbackParmater("testCommand", "testProjectPath");
    ok(result.indexOf("Result is an object") >= 0);
  });

  it("unsupported command", async () => {
    const context: any = {
      subscriptions: {
        push: () => {},
      },
    };

    workspaceInstance.initWorkspaceAPI(context);

    ok(commandParmater === "project-api.command.run");

    commandExecutorMock
      .expects("execute")
      .withExactArgs("unsupportedCommand", "testProjectPath")
      .throws(new Error("Unsupported command"));
    const result = await callbackParmater(
      "unsupportedCommand",
      "testProjectPath"
    );
    ok(result.indexOf("Unsupported command") >= 0);
  });
});
