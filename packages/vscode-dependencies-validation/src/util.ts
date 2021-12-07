import type { DiagnosticCollection } from "vscode";
import { NOT_IN_NODE_MODULES_PATTERN } from "./constants";
import { VscodeUriFile } from "./vscodeTypes";

export function isNotInNodeModules(absPath: string): boolean {
  return NOT_IN_NODE_MODULES_PATTERN.test(absPath);
}

export function clearDiagnostics(
  diagnosticCollection: DiagnosticCollection,
  absPath: string,
  createUri: VscodeUriFile
): void {
  diagnosticCollection.delete(createUri(absPath));
}
