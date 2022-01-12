import { NPM_DEPENDENCY_ISSUES_CODE } from "../src/constants";
import type {
  DiagnosticCollection,
  CodeActionContext,
  OutputChannel,
  CodeActionKind,
  Diagnostic,
} from "vscode";

export const outputChannelMock = <OutputChannel>{};
outputChannelMock.show = () => "";
outputChannelMock.append = () => "";
outputChannelMock.appendLine = () => "";

export const diagnosticCollectionMock = <DiagnosticCollection>{};
diagnosticCollectionMock.set = () => "";

const diagnosticMock = <Diagnostic>{};
diagnosticMock.code = NPM_DEPENDENCY_ISSUES_CODE;

export const codeActionContextMock = <CodeActionContext>{
  diagnostics: [diagnosticMock],
  triggerKind: 2,
  only: <CodeActionKind>{},
};
