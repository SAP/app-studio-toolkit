import { dirname } from "path";
import * as proxyquire from "proxyquire";
import { createSandbox, SinonMock, SinonSandbox } from "sinon";
import { outputChannelMock, diagnosticCollectionMock } from "./vscodeMocks";
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
  let outputChannelSinonMock: SinonMock;
  let npmDepsValidationMock: SinonMock;
  let diagnosticsMock: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    outputChannelSinonMock = sandbox.mock(outputChannelMock);
    npmDepsValidationMock = sandbox.mock(npmDepsValidationProxy);
    diagnosticsMock = sandbox.mock(diagnosticsProxy);
  });

  afterEach(() => {
    outputChannelSinonMock.verify();
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

      outputChannelSinonMock.expects("show").withExactArgs(true);
      outputChannelSinonMock
        .expects("appendLine")
        .withExactArgs(`\nFixing dependency issues ...`);
      npmDepsValidationMock
        .expects("invokeNPMCommand")
        .withExactArgs(
          {
            commandArgs: ["install"],
            cwd: dirname(packageJsonPath),
          },
          outputChannelMock
        )
        .resolves();
      outputChannelSinonMock.expects("append");
      diagnosticsMock
        .expects("refreshDiagnostics")
        .withExactArgs(packageJsonPath, diagnosticCollectionMock)
        .resolves();

      await fixAllDepIssuesCommandProxy(
        outputChannelMock,
        packageJsonPath,
        diagnosticCollectionMock
      );
    });

    it("failed", async () => {
      const packageJsonPath = "root/folder/package.json";

      outputChannelSinonMock.expects("show").withExactArgs(true);
      outputChannelSinonMock
        .expects("appendLine")
        .withExactArgs(`\nFixing dependency issues ...`);
      npmDepsValidationMock
        .expects("invokeNPMCommand")
        .withExactArgs(
          {
            commandArgs: ["install"],
            cwd: dirname(packageJsonPath),
          },
          outputChannelMock
        )
        .rejects(new Error("invokeNPMCommand failure"));
      outputChannelSinonMock.expects("appendLine");

      await fixAllDepIssuesCommandProxy(
        outputChannelMock,
        packageJsonPath,
        diagnosticCollectionMock
      );
    });
  });
});
