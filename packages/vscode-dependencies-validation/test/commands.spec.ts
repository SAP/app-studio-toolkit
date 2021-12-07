import type { DiagnosticCollection } from "vscode";
import { dirname } from "path";
import * as proxyquire from "proxyquire";
import { createSandbox, SinonMock, SinonSandbox } from "sinon";
import { internal } from "../src/commands";
import { outputChannelMock } from "./vscodeMocks";
import { diagnosticsProxy, npmDepsValidationProxy } from "./moduleProxies";

describe("commands unit test", () => {
  let sandbox: SinonSandbox;
  let outputChannelSinonMock: SinonMock;
  let npmDepsValidationMock: SinonMock;
  let diagnosticsSinonMock: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    outputChannelSinonMock = sandbox.mock(outputChannelMock);
    npmDepsValidationMock = sandbox.mock(npmDepsValidationProxy);
    diagnosticsSinonMock = sandbox.mock(diagnosticsProxy);
  });

  afterEach(() => {
    outputChannelSinonMock.verify();
    npmDepsValidationMock.verify();
  });

  context("executeAllFixCommand()", () => {
    let fixAllDepIssuesCommandProxy: typeof internal.fixAllDepIssuesCommand;

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
      diagnosticsSinonMock
        .expects("refreshDiagnostics")
        .withExactArgs(packageJsonPath, <DiagnosticCollection>{})
        .resolves();

      await fixAllDepIssuesCommandProxy(
        outputChannelMock,
        packageJsonPath,
        <DiagnosticCollection>{}
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
        <DiagnosticCollection>{}
      );
    });
  });
});
