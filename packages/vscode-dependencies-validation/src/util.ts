import type { DiagnosticCollection, Uri } from "vscode";
import {
  findDependencyIssues,
  fixDependencyIssues,
} from "@sap-devx/npm-dependencies-validation";
import { isEmpty } from "lodash";
import { VscodeOutputChannel } from "./vscodeTypes";

export function isInsideNodeModules(absPath: string): boolean {
  return /[\\/]node_modules[\\/]/.test(absPath);
}

export function clearDiagnostics(
  diagnosticCollection: DiagnosticCollection,
  fileUri: Uri
): void {
  diagnosticCollection.delete(fileUri);
}

export async function findAndFixDepsIssues(
  packageJsonUri: Uri,
  outputChannel: VscodeOutputChannel
): Promise<void> {
  const { fsPath } = packageJsonUri;
  const depIssues = await findDependencyIssues(fsPath);
  if (isEmpty(depIssues)) {
    return;
  }
  await fixDependencyIssues(fsPath, outputChannel);
}
