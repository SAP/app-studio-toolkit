import type { DiagnosticCollection, Uri } from "vscode";
import { dirname } from "path";
import {
  findDependencyIssues,
  invokeNPMCommand,
} from "@sap-devx/npm-dependencies-validation";
import { isEmpty } from "lodash";
import { VscodeOutputChannel } from "./vscodeTypes";

const NOT_IN_NODE_MODULES_PATTERN =
  /^(?!.*[\\|\/]node_modules[\\|\/]).*[\\|\/].+/;

export function isNotInNodeModules(uri: Uri): boolean {
  return NOT_IN_NODE_MODULES_PATTERN.test(uri.fsPath);
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

export async function fixDepsIssues(
  packageJsonUri: Uri,
  outputChannel: VscodeOutputChannel
): Promise<void> {
  // package.json parent dir
  const cwd = dirname(packageJsonUri.fsPath);
  outputChannel.appendLine(`\nFixing dependency issues of ${cwd} ...\n`);

  const config = { commandArgs: ["install"], cwd };
  await invokeNPMCommand(config, outputChannel);

  outputChannel.appendLine(`Done.\n`);
}
