import { dirname } from "path";
import * as proxyquire from "proxyquire";
import { createSandbox, SinonMock, SinonSandbox } from "sinon";
import { outputChannel, diagnosticCollection } from "./vscodeMocks";
import { fixAllDepIssuesCommand } from "../src/commands";

const npmDepsValidationProxy = {
  invokeNPMCommand() {
    return Promise.reject("invokeNPMCommand method is not implemented");
  },
  "@noCallThru": true,
};

const diagnosticsProxy = {
  refreshDiagnostics() {
    return Promise.reject("refreshDiagnostics method is not implemented");
  },
  "@noCallThru": true,
};

describe("commands unit test", () => {
  let sandbox: SinonSandbox;
  let outputChannelMock: SinonMock;
  let npmDepsValidationMock: SinonMock;
  let diagnosticsMock: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    outputChannelMock = sandbox.mock(outputChannel);
    npmDepsValidationMock = sandbox.mock(npmDepsValidationProxy);
    diagnosticsMock = sandbox.mock(diagnosticsProxy);
  });

  afterEach(() => {
    outputChannelMock.verify();
    npmDepsValidationMock.verify();
  });

  context("executeAllFixCommand()", () => {
    let fixAllDepIssuesCommandProxy: typeof fixAllDepIssuesCommand;

    before(() => {
      const commandsModule = proxyquire("../src/commands", {
        "./diagnostics": diagnosticsProxy,
        "@sap-devx/npm-dependencies-validation": npmDepsValidationProxy,
      });

      fixAllDepIssuesCommandProxy = commandsModule.fixAllDepIssuesCommand;
    });

    it("succeeded", async () => {
      const packageJsonPath = "root/folder/package.json";

      outputChannelMock.expects("show").withExactArgs(true);
      outputChannelMock
        .expects("appendLine")
        .withExactArgs(`\nFixing dependency issues ...`);
      npmDepsValidationMock
        .expects("invokeNPMCommand")
        .withExactArgs(
          {
            commandArgs: ["install"],
            cwd: dirname(packageJsonPath),
          },
          outputChannel
        )
        .resolves();
      outputChannelMock.expects("append");
      diagnosticsMock
        .expects("refreshDiagnostics")
        .withExactArgs(packageJsonPath, diagnosticCollection)
        .resolves();

      await fixAllDepIssuesCommandProxy(
        outputChannel,
        packageJsonPath,
        diagnosticCollection
      );
    });

    it("failed", async () => {
      const packageJsonPath = "root/folder/package.json";

      outputChannelMock.expects("show").withExactArgs(true);
      outputChannelMock
        .expects("appendLine")
        .withExactArgs(`\nFixing dependency issues ...`);
      npmDepsValidationMock
        .expects("invokeNPMCommand")
        .withExactArgs(
          {
            commandArgs: ["install"],
            cwd: dirname(packageJsonPath),
          },
          outputChannel
        )
        .rejects(new Error("invokeNPMCommand failure"));
      outputChannelMock.expects("appendLine");

      await fixAllDepIssuesCommandProxy(
        outputChannel,
        packageJsonPath,
        diagnosticCollection
      );
    });
  });
});
