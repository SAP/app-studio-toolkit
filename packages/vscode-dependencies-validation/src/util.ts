import type { DiagnosticCollection, Uri } from "vscode";
import {
  findDependencyIssues,
  fixDependencyIssues,
} from "@sap-devx/npm-dependencies-validation";
import { isEmpty } from "lodash";
import { VscodeOutputChannel } from "./vscodeTypes";

const INSIDE_NODE_MODULES_PATTERN = new RegExp(`[\\|/]node_modules[\\|/]`); // TODO: does not work with path.sep ???

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
  const { problems } = await findDependencyIssues(packageJsonUri.fsPath);
  if (isEmpty(problems)) return;

  return fixDepsIssues(packageJsonUri, outputChannel);
}

function getDateAndTime(): string {
  const today = new Date();
  const date = `${today.getFullYear()}-${
    today.getMonth() + 1
  }-${today.getDate()}`;
  const time = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
  return `${date} ${time}`;
}

export const internal = {
  fixing: (absPath: string) =>
    `\n${absPath}\n[${getDateAndTime()}] Fixing dependency issues...\n`,
  doneFixing: (absPath: string) =>
    `\n[${getDateAndTime()}] Done. \n${absPath}\n`,
};

export async function fixDepsIssues(
  packageJsonUri: Uri,
  outputChannel: VscodeOutputChannel
): Promise<void> {
  const { fsPath } = packageJsonUri;
  outputChannel.appendLine(internal.fixing(fsPath));

  await fixDependencyIssues(fsPath, outputChannel);

  outputChannel.appendLine(internal.doneFixing(fsPath));
}
