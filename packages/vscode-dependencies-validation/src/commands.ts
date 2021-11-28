import { dirname } from "path";
import {
  DiagnosticCollection,
  OutputChannel,
  TextDocument,
  Uri,
  workspace,
} from "vscode";
import {
  invokeNPMCommand,
  NPMDependencyIssue,
} from "@sap-devx/npm-dependencies-validation";
import { refreshDiagnostics } from "./diagnostics";

export async function install(
  outputChannel: OutputChannel,
  depIssue: NPMDependencyIssue,
  packageJsonPath: string,
  dependencyIssuesDiagnosticCollection: DiagnosticCollection
): Promise<void> {
  const { name, version } = depIssue;
  outputChannel.show(true);

  try {
    outputChannel.appendLine(
      `Executing install of ${JSON.stringify(depIssue)}`
    );
    const start = Date.now();
    await invokeNPMCommand(
      ["install", `${name}@${version}`],
      dirname(packageJsonPath),
      outputChannel
    );
    const finish = Date.now();
    outputChannel.appendLine(
      `Finished install of ${JSON.stringify(depIssue)} in ${
        finish - start
      } millis`
    );

    void refreshPackageJsonDiagnostics(
      packageJsonPath,
      dependencyIssuesDiagnosticCollection
    );
  } catch (error) {
    outputChannel.appendLine(
      `Install of ${JSON.stringify(depIssue)} failed: ${error.stack}`
    );
  }
}

export async function prune(
  outputChannel: OutputChannel,
  depIssue: NPMDependencyIssue,
  packageJsonPath: string,
  dependencyIssuesDiagnosticCollection: DiagnosticCollection
): Promise<void> {
  const { name } = depIssue;
  outputChannel.show(true);

  try {
    outputChannel.appendLine(`Executing prune of ${JSON.stringify(depIssue)}`);
    const start = Date.now();
    await invokeNPMCommand(
      ["prune", `${name}`],
      dirname(packageJsonPath),
      outputChannel
    );

    const finish = Date.now();
    outputChannel.appendLine(
      `Finished prune of ${JSON.stringify(depIssue)} in ${
        finish - start
      } millis`
    );

    void refreshPackageJsonDiagnostics(
      packageJsonPath,
      dependencyIssuesDiagnosticCollection
    );
  } catch (error) {
    outputChannel.appendLine(
      `Prune of ${JSON.stringify(depIssue)} failed: ${error.stack}`
    );
  }
}

function getPackageJsonDocument(
  packageJsonPath: string
): Thenable<TextDocument> {
  return workspace.openTextDocument(Uri.file(packageJsonPath));
}

async function refreshPackageJsonDiagnostics(
  packageJsonPath: string,
  dependencyIssuesDiagnosticCollection: DiagnosticCollection
): Promise<void> {
  const packageJsonTextDoc = await getPackageJsonDocument(packageJsonPath);
  await refreshDiagnostics(
    packageJsonTextDoc,
    dependencyIssuesDiagnosticCollection
  );
}
