import type { convertToDiagnostics as convertToDiagnosticsType } from "../../src/diagnostics/convertToDiagnostics";
import type { DepIssue } from "@sap-devx/npm-dependencies-validation";
import { expect } from "chai";
import { Range, Diagnostic } from "jest-mock-vscode/dist/vscode/extHostTypes";
import * as proxyquire from "proxyquire";

const proxyQuireNoCallThru = proxyquire.noCallThru();

describe("convertToDiagnostics() function", () => {
  let convertToDiagnostics: typeof convertToDiagnosticsType;

  before(() => {
    convertToDiagnostics = proxyQuireNoCallThru(
      "../../src/diagnostics/convertToDiagnostics",
      {
        vscode: { Range, Diagnostic },
      }
    ).convertToDiagnostics;
  });

  context("positive", () => {
    let pkgJsonText: string;
    let readFileMock: any; // cannot select correct overload of `readFile` signature.
    before(() => {
      pkgJsonText = `{
      "name": "inline-pkg-json",
      "version": "1.0.0",
      "dependencies": {
        "lodash": "~4.17.21"
      },
      "devDependencies": {
        "mocha": "^5.0.0"
      }
    }
    ` // removing leading whitespace to make calculating the expected range assertions easier.
        .replace(/\n\s*/g, "\n");

      /* eslint-disable-next-line @typescript-eslint/require-await -- hacky test mock... */
      readFileMock = async () => {
        return pkgJsonText;
      };
    });

    it("can convert a single dependency issue to a vscode diagnostic", async () => {
      const issues: DepIssue[] = [
        {
          type: "missing",
          name: "lodash",
          isDev: false,
        },
      ];

      const actualDiagnostics = await convertToDiagnostics({
        pkgJsonPath: "dummy",
        issues,
        readFile: readFileMock,
      });

      expect(actualDiagnostics).to.deep.equal([
        {
          severity: 0,
          message: 'The "lodash" package is not installed',
          range: {
            _start: {
              _line: 4,
              _character: 11,
            },
            _end: {
              _line: 4,
              _character: 19,
            },
          },
          code: "npm_dependency_issues",
        },
      ]);
    });

    it("can convert a single **dev**-dependency issue to a vscode diagnostic", async () => {
      const issues: DepIssue[] = [
        {
          type: "mismatch",
          expected: "^5.0.0",
          actual: "4.0.0",
          name: "mocha",
          isDev: true,
        },
      ];

      const actualDiagnostics = await convertToDiagnostics({
        pkgJsonPath: "dummy",
        issues,
        readFile: readFileMock,
      });

      expect(actualDiagnostics).to.deep.equal([
        {
          severity: 0,
          message:
            'The "mocha" package installed version "4.0.0", does not match the declared range "^5.0.0"',
          range: {
            _start: {
              _line: 7,
              _character: 10,
            },
            _end: {
              _line: 7,
              _character: 16,
            },
          },
          code: "npm_dependency_issues",
        },
      ]);
    });

    it("can convert multiple issues to vscode diagnostics", async () => {
      const issues: DepIssue[] = [
        {
          type: "missing",
          name: "lodash",
          isDev: false,
        },
        {
          type: "mismatch",
          expected: "^5.0.0",
          actual: "4.0.0",
          name: "mocha",
          isDev: true,
        },
      ];

      const actualDiagnostics = await convertToDiagnostics({
        pkgJsonPath: "dummy",
        issues,
        readFile: readFileMock,
      });

      expect(actualDiagnostics).to.deep.equalInAnyOrder([
        {
          severity: 0,
          message: 'The "lodash" package is not installed',
          range: {
            _start: {
              _line: 4,
              _character: 11,
            },
            _end: {
              _line: 4,
              _character: 19,
            },
          },
          code: "npm_dependency_issues",
        },
        {
          severity: 0,
          message:
            'The "mocha" package installed version "4.0.0", does not match the declared range "^5.0.0"',
          range: {
            _start: {
              _line: 7,
              _character: 10,
            },
            _end: {
              _line: 7,
              _character: 16,
            },
          },
          code: "npm_dependency_issues",
        },
      ]);
    });
  });

  context("negative", () => {
    it("will return an empty diagnostics array for an invalid package.json", async () => {
      const issues: DepIssue[] = [
        {
          type: "missing",
          name: "lodash",
          isDev: false,
        },
      ];

      const actualDiagnostics = await convertToDiagnostics({
        pkgJsonPath: "dummy",
        issues,
        /* eslint-disable-next-line @typescript-eslint/require-await -- hacky test mock... */
        readFile: (async () => "I am not a JSON text") as any,
      });

      expect(actualDiagnostics).to.be.empty;
    });

    it("will return an empty diagnostics array if a runtime exception occurs", async () => {
      const issues: DepIssue[] = [
        {
          type: "missing",
          name: "lodash",
          isDev: false,
        },
      ];

      const actualDiagnostics = await convertToDiagnostics({
        pkgJsonPath: "dummy",
        issues,
        /* eslint-disable-next-line @typescript-eslint/require-await -- hacky test mock... */
        readFile: (async () => {
          throw "muahahahhah!";
        }) as any,
      });

      expect(actualDiagnostics).to.be.empty;
    });

    it("will return an empty diagnostics array if a runtime exception occurs", async () => {
      const issues: DepIssue[] = [
        {
          type: "missing",
          name: "lodash",
          isDev: false,
        },
      ];

      const actualDiagnostics = await convertToDiagnostics({
        pkgJsonPath: "dummy",
        issues,
        /* eslint-disable-next-line @typescript-eslint/require-await -- hacky test mock... */
        readFile: (async () =>
          '{ "dependencies" : { "lodash-typo": "4.17.1" }}') as any,
      });

      expect(actualDiagnostics).to.be.empty;
    });
  });
});
