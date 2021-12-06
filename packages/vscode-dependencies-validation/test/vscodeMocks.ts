import { NPM_DEPENDENCY_ISSUES_CODE } from "../src/constants";
import type {
  Diagnostic,
  DiagnosticCollection,
  Uri,
  CodeActionContext,
  Range,
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

export const codeActionContextMock: CodeActionContext = {
  triggerKind: 2,
  diagnostics: [
    {
      range: <Range>{},
      message: "",
      severity: 1,
      code: "other_code",
    },
    {
      range: <Range>{},
      message: "dependency issue",
      severity: 2,
      code: NPM_DEPENDENCY_ISSUES_CODE,
    },
  ],
  only: undefined,
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
