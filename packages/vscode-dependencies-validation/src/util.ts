import type { DiagnosticCollection, Uri } from "vscode";
import {
  findDependencyIssues,
  fixDependencyIssues,
} from "@sap-devx/npm-dependencies-validation";
import { isEmpty } from "lodash";
import { VscodeOutputChannel } from "./vscodeTypes";

const INSIDE_NODE_MODULES_PATTERN = new RegExp(`[\\|/]node_modules[\\|/]`);

export function isInsideNodeModules(absPath: string): boolean {
  return INSIDE_NODE_MODULES_PATTERN.test(absPath);
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
  const { problems } = await findDependencyIssues(fsPath);
  if (isEmpty(problems)) return;

  await fixDependencyIssues(fsPath, outputChannel);
}
