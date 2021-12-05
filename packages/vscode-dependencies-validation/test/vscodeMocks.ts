import { NPM_DEPENDENCY_ISSUES_CODE } from "../src/constants";
import type {
  Diagnostic,
  DiagnosticCollection,
  Uri,
  CancellationToken,
  CodeActionContext,
  Event,
  Position,
  Range,
  TextDocument,
  TextLine,
  CodeActionKind,
} from "vscode";
import { VscodeOutputChannel } from "../src/vscodeTypes";

export const outputChannelMock: VscodeOutputChannel = {
  append(value: string) {},
  appendLine(value: string) {},
  // @ts-expect-error -- https://stackoverflow.com/questions/68799234/typescript-pick-only-specific-method-from-overload-to-be-passed-to-parameterst
  show(value?: boolean) {},
};

export const diagnosticCollectionMock: DiagnosticCollection = {
  name: "",
  // @ts-expect-error -- https://stackoverflow.com/questions/68799234/typescript-pick-only-specific-method-from-overload-to-be-passed-to-parameterst
  set: function (
    uri: Uri,
    diagnostics: readonly Diagnostic[] | undefined
  ): void {
    //throw new Error("Function not implemented.");
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

export const textDocumentMock: TextDocument = {
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

const positionMock: Position = {
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

export const rangeMock: Range = {
  start: positionMock,
  end: positionMock,
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

export const codeActionContextMock: CodeActionContext = {
  triggerKind: 2,
  diagnostics: [
    {
      range: rangeMock,
      message: "",
      severity: 1,
      code: "other_code",
    },
    {
      range: rangeMock,
      message: "dependency issue",
      severity: 2,
      code: NPM_DEPENDENCY_ISSUES_CODE,
    },
  ],
  only: undefined,
};

export const cancellationTokenMock: CancellationToken = {
  isCancellationRequested: false,
  onCancellationRequested: {} as Event<any>,
};

export const codeActionKindMock: CodeActionKind = {
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
