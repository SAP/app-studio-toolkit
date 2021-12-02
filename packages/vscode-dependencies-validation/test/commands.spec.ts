import type { Diagnostic, DiagnosticCollection, Uri } from "vscode";
import { dirname } from "path";
import * as proxyquire from "proxyquire";
import { createSandbox, SinonMock, SinonSandbox } from "sinon";
import { VscodeOutputChannel } from "../src/vscodeTypes";
import { NpmCommandConfig } from "@sap-devx/npm-dependencies-validation";
import { fixAllDepIssuesCommand } from "../src/commands";

const outputChannel: VscodeOutputChannel = {
  append(value: string) {},
  appendLine(value: string) {},
  // @ts-expect-error -- https://stackoverflow.com/questions/68799234/typescript-pick-only-specific-method-from-overload-to-be-passed-to-parameterst
  show(value?: boolean) {},
};

const diagnosticCollection: DiagnosticCollection = {
  name: "",
  // @ts-expect-error -- https://stackoverflow.com/questions/68799234/typescript-pick-only-specific-method-from-overload-to-be-passed-to-parameterst
  set: function (
    uri: Uri,
    diagnostics: readonly Diagnostic[] | undefined
  ): void {
    throw new Error("Function not implemented.");
  },
  delete: function (uri: Uri): void {
    throw new Error("Function not implemented.");
  },
  clear: function (): void {
    throw new Error("Function not implemented.");
  },
  forEach: function (
    callback: (
      uri: Uri,
      diagnostics: readonly Diagnostic[],
      collection: DiagnosticCollection
    ) => any,
    thisArg?: any
  ): void {
    throw new Error("Function not implemented.");
  },
  get: function (uri: Uri): readonly Diagnostic[] | undefined {
    throw new Error("Function not implemented.");
  },
  has: function (uri: Uri): boolean {
    throw new Error("Function not implemented.");
  },
  dispose: function (): void {
    throw new Error("Function not implemented.");
  },
};

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
      const config: NpmCommandConfig = {
        commandArgs: ["install"],
        cwd: dirname(packageJsonPath),
      };
      npmDepsValidationMock
        .expects("invokeNPMCommand")
        .withExactArgs(config, outputChannel)
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
      const config: NpmCommandConfig = {
        commandArgs: ["install"],
        cwd: dirname(packageJsonPath),
      };
      npmDepsValidationMock
        .expects("invokeNPMCommand")
        .withExactArgs(config, outputChannel)
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
