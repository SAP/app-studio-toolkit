import type { Uri } from "vscode";
import proxyquire = require("proxyquire");
import { createSandbox, SinonMock, SinonSandbox } from "sinon";
import { diagnosticCollectionMock } from "./vscodeMocks";
import { refreshDiagnostics } from "../src/diagnostics";
import { npmDepsValidationProxy } from "./moduleProxies";

describe("diagnostics unit test", () => {
  const packageJsonPath = "/root/folder/package.json";
  class Range {
    constructor(n1: number, n2: number, n3: number, n4: number) {}
  }
  const enum DiagnosticSeverity {
    Error = 0,
  }
  class Diagnostic {
    constructor(r: Range, m: string, ds: DiagnosticSeverity, code?: string) {}
  }

  let refreshDiagnosticsProxy: typeof refreshDiagnostics;
  let sandbox: SinonSandbox;
  let diagnosticCollectionSinonMock: SinonMock;
  let npmDepsValidationSinonMock: SinonMock;

  context("refreshDiagnostics()", () => {
    before(() => {
      sandbox = createSandbox();
    });

    beforeEach(() => {
      const diagnosticsModule = proxyquire("../src/diagnostics", {
        vscode: {
          Range,
          Diagnostic,
          "@noCallThru": true,
        },
        "@sap-devx/npm-dependencies-validation": npmDepsValidationProxy,
      });

      refreshDiagnosticsProxy = diagnosticsModule.refreshDiagnostics;

      diagnosticCollectionSinonMock = sandbox.mock(diagnosticCollectionMock);
      npmDepsValidationSinonMock = sandbox.mock(npmDepsValidationProxy);
    });

    afterEach(() => {
      diagnosticCollectionSinonMock.verify();
      npmDepsValidationSinonMock.verify();
    });

    after(() => {
      sandbox.restore();
    });

    it("there are 2 dependency issues", async () => {
      const uri = <Uri>{ fsPath: packageJsonPath };
      npmDepsValidationSinonMock.expects("findDependencyIssues").resolves({
        problems: ["missing: json-fixer@1.6.12", "missing: lodash@0.0.1"],
      });
      diagnosticCollectionSinonMock.expects("set").withArgs(uri);
      await refreshDiagnosticsProxy(
        uri,
        diagnosticCollectionMock
      );
    });

    it("there are no dependency issues", async () => {
      const uri = <Uri>{ fsPath: packageJsonPath };
      npmDepsValidationSinonMock
        .expects("findDependencyIssues")
        .resolves({ problems: undefined });
      const diagnostics: Diagnostic[] = [];
      diagnosticCollectionSinonMock
        .expects("set")
        .withExactArgs(uri, diagnostics);
      await refreshDiagnosticsProxy(
        uri,
        diagnosticCollectionMock
      );
    });
  });
});
