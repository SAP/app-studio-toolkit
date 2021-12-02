import proxyquire = require("proxyquire");
import { diagnosticCollection } from "./vscodeMocks";
import { createSandbox, SinonMock, SinonSandbox } from "sinon";
import { refreshDiagnostics } from "../src/diagnostics";
import { range } from "lodash";
import { NPM_DEPENDENCY_ISSUES_CODE } from "../src/constants";

describe("diagnostics unit test", () => {
  const packageJsonPath = "/root/folder/package.json";
  const Uri = {
    file: (path: string) => `uri_${path}`,
  };
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
  let problems: string[] | undefined;
  let sandbox: SinonSandbox;
  let diagnosticCollectionMock: SinonMock;

  context("refreshDiagnostics()", () => {
    before(() => {
      sandbox = createSandbox();

      const diagnosticsModule = proxyquire("../src/diagnostics", {
        vscode: {
          Range,
          Diagnostic,
          Uri,
          "@noCallThru": true,
        },
        "@sap-devx/npm-dependencies-validation": {
          findDependencyIssues: async () => Promise.resolve({ problems }),
          "@noCallThru": true,
        },
      });

      refreshDiagnosticsProxy = diagnosticsModule.refreshDiagnostics;
    });

    beforeEach(() => {
      diagnosticCollectionMock = sandbox.mock(diagnosticCollection);
    });

    afterEach(() => {
      diagnosticCollectionMock.verify();
    });

    after(() => {
      sandbox.restore();
    });

    it("there are 2 dependency issues", async () => {
      problems = ["missing: json-fixer@1.6.12", "missing: lodash@0.0.1"];
      const diagnostic = new Diagnostic(
        new Range(0, 0, 0, 10),
        problems.join("\n"),
        0,
        NPM_DEPENDENCY_ISSUES_CODE
      );
      //const diagnostics = [diagnostic];
      diagnosticCollectionMock
        .expects("set")
        .withArgs(Uri.file(packageJsonPath));
      await refreshDiagnosticsProxy(packageJsonPath, diagnosticCollection);
    });

    it("there are no dependency issues", async () => {
      problems = undefined;
      const diagnostics: Diagnostic[] = [];
      diagnosticCollectionMock
        .expects("set")
        .withExactArgs(Uri.file(packageJsonPath), diagnostics);
      await refreshDiagnosticsProxy(packageJsonPath, diagnosticCollection);
    });
  });
});
