import { expect } from "chai";
import * as proxyquire from "proxyquire";
import { NPM_DEPENDENCY_ISSUES_CODE } from "../src/constants";
import type {
  CancellationToken,
  CodeAction,
  CodeActionContext,
  CodeActionKind,
  Event,
  Position,
  Range,
  TextDocument,
  TextLine,
} from "vscode";
import { NPMIssuesActionProvider } from "../src/npmIssuesActionProvider";

const diagnosticsProxy = {
  refreshDiagnostics() {
    return Promise.reject("refreshDiagnostics method is not implemented");
  },
  "@noCallThru": true,
};

const commandsProxy = {
  invokeNPMCommand() {
    return Promise.reject("invokeNPMCommand method is not implemented");
  },
  "@noCallThru": true,
};

const doc: TextDocument = {
  fileName: "",
  isUntitled: false,
  languageId: "",
  version: 0,
  isDirty: false,
  isClosed: false,
  save: function (): Thenable<boolean> {
    throw new Error("Function not implemented.");
  },
  eol: 1,
  lineCount: 0,

  offsetAt: function (position: Position): number {
    throw new Error("Function not implemented.");
  },
  positionAt: function (offset: number): Position {
    throw new Error("Function not implemented.");
  },
  getText: function (range?: Range): string {
    throw new Error("Function not implemented.");
  },
  getWordRangeAtPosition: function (
    position: Position,
    regex?: RegExp
  ): Range | undefined {
    throw new Error("Function not implemented.");
  },
  validateRange: function (range: Range): Range {
    throw new Error("Function not implemented.");
  },
  validatePosition: function (position: Position): Position {
    throw new Error("Function not implemented.");
  },
  // @ts-expect-error -- https://stackoverflow.com/questions/68799234/typescript-pick-only-specific-method-from-overload-to-be-passed-to-parameterst
  lineAt: function (line: Position): TextLine {
    throw new Error("Function not implemented.");
  },
};

const position: Position = {
  line: 0,
  character: 0,
  isBefore: function (other: Position): boolean {
    throw new Error("Function not implemented.");
  },
  isBeforeOrEqual: function (other: Position): boolean {
    throw new Error("Function not implemented.");
  },
  isAfter: function (other: Position): boolean {
    throw new Error("Function not implemented.");
  },
  isAfterOrEqual: function (other: Position): boolean {
    throw new Error("Function not implemented.");
  },
  isEqual: function (other: Position): boolean {
    throw new Error("Function not implemented.");
  },
  compareTo: function (other: Position): number {
    throw new Error("Function not implemented.");
  },
  // @ts-expect-error -- https://stackoverflow.com/questions/68799234/typescript-pick-only-specific-method-from-overload-to-be-passed-to-parameterst
  translate: function (lineDelta?: number, characterDelta?: number): Position {
    throw new Error("Function not implemented.");
  },
  // @ts-expect-error -- https://stackoverflow.com/questions/68799234/typescript-pick-only-specific-method-from-overload-to-be-passed-to-parameterst
  with: function (line?: number, character?: number): Position {
    throw new Error("Function not implemented.");
  },
};

const range: Range = {
  start: position,
  end: position,
  isEmpty: false,
  isSingleLine: false,
  contains: function (positionOrRange: Position | Range): boolean {
    throw new Error("Function not implemented.");
  },
  isEqual: function (other: Range): boolean {
    throw new Error("Function not implemented.");
  },
  intersection: function (range: Range): Range | undefined {
    throw new Error("Function not implemented.");
  },
  union: function (other: Range): Range {
    throw new Error("Function not implemented.");
  },
  // @ts-expect-error -- https://stackoverflow.com/questions/68799234/typescript-pick-only-specific-method-from-overload-to-be-passed-to-parameterst
  with: function (start?: Position, end?: Position): Range {
    throw new Error("Function not implemented.");
  },
};

const context: CodeActionContext = {
  triggerKind: 2,
  diagnostics: [
    {
      range,
      message: "",
      severity: 1,
      code: "other_code",
    },
    {
      range,
      message: "dependency issue",
      severity: 2,
      code: NPM_DEPENDENCY_ISSUES_CODE,
    },
  ],
  only: undefined,
};

const token: CancellationToken = {
  isCancellationRequested: false,
  onCancellationRequested: {} as Event<any>,
};

const kind: CodeActionKind = {
  value: "QuickFix",
  append: function (parts: string): CodeActionKind {
    throw new Error("Function not implemented.");
  },
  intersects: function (other: CodeActionKind): boolean {
    throw new Error("Function not implemented.");
  },
  contains: function (other: CodeActionKind): boolean {
    throw new Error("Function not implemented.");
  },
};

describe("npmIssuesActionProvider unit test", () => {
  let provider: NPMIssuesActionProvider;

  before(() => {
    const npmIssuesActionProviderModule = proxyquire(
      "../src/npmIssuesActionProvider",
      {
        "./diagnostics": diagnosticsProxy,
        "./commands": commandsProxy,
      }
    );

    provider = new npmIssuesActionProviderModule.NPMIssuesActionProvider(kind);
  });

  it("provideCodeActions", () => {
    const actions: CodeAction[] = provider.provideCodeActions(
      doc,
      range,
      context,
      token
    );
    expect(actions).to.have.lengthOf(1);
  });
});
