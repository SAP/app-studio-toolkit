import type { DiagnosticCollection, Uri } from "vscode";
import { dirname } from "path";
import {
  findDependencyIssues,
  invokeNPMCommand,
} from "@sap-devx/npm-dependencies-validation";
import { isEmpty } from "lodash";
import { VscodeOutputChannel } from "./vscodeTypes";

const INSIDE_NODE_MODULES_PATTERN = new RegExp(`[\\|/]node_modules[\\|/]`); // TODO: does not work with path.sep ???

export function isInsideNodeModules(uri: Uri): boolean {
  return INSIDE_NODE_MODULES_PATTERN.test(uri.fsPath);
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

export const internal = {
  fixing: (absPath: string) => `\nFixing dependency issues of ${absPath} ...\n`,
  doneFixing: (absPath: string) => `Done. ${absPath}\n`,
};

export async function fixDepsIssues(
  packageJsonUri: Uri,
  outputChannel: VscodeOutputChannel
): Promise<void> {
  const { fsPath } = packageJsonUri;
  outputChannel.appendLine(internal.fixing(fsPath));

  const config = { commandArgs: ["install"], cwd: dirname(fsPath) };
  await invokeNPMCommand(config, outputChannel);

  outputChannel.appendLine(internal.doneFixing(fsPath));
}
