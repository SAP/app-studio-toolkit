import type { DiagnosticCollection } from "vscode";
import { VscodeUriFile } from "./vscodeTypes";

const NOT_IN_NODE_MODULES_PATTERN =
  /^(?!.*[\\|\/]node_modules[\\|\/]).*[\\|\/].+/;

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
