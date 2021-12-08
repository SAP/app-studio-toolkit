import type { DiagnosticCollection, Uri } from "vscode";
import { dirname } from "path";
import * as proxyquire from "proxyquire";
import { createSandbox, SinonMock, SinonSandbox } from "sinon";
import { internal } from "../src/commands";
import { outputChannelMock } from "./vscodeMocks";
import { diagnosticsProxy, npmDepsValidationProxy } from "./moduleProxies";

describe.skip("commands unit test", () => {
  let sandbox: SinonSandbox;
  let outputChannelSinonMock: SinonMock;
  let npmDepsValidationMock: SinonMock;
  let diagnosticsSinonMock: SinonMock;

  const Uri = {
    file: (path: string) => `uri_${path}`,
  };

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
        vscode: {
          Uri,
          "@noCallThru": true,
        },
      });

      fixAllDepIssuesCommandProxy =
        commandsModule.internal.fixAllDepIssuesCommand;
    });

    it("succeeded", async () => {
      const packageJsonPath = "root/folder/package.json";

      const uri = Uri.file(packageJsonPath);

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
        <DiagnosticCollection>{},
        uri as unknown as Uri
      );
    });

    it("failed", async () => {
      const packageJsonPath = "root/folder/package.json";

      const uri = Uri.file(packageJsonPath);

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
        <DiagnosticCollection>{},
        uri as unknown as Uri
      );
    });
  });
});
