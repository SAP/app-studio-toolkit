import { dirname } from "path";
import {
  commands,
  DiagnosticCollection,
  ExtensionContext,
  OutputChannel,
  TextDocument,
  Uri,
  workspace,
} from "vscode";
import { invokeNPMCommand } from "@sap-devx/npm-dependencies-validation";
import { refreshDiagnostics } from "./diagnostics";

export const FIX_ALL_COMMAND = "fix.all.dependency.issues.command";

export function registerFixCommand(
  context: ExtensionContext,
  outputChannel: OutputChannel,
  dependencyIssuesDiagnosticCollection: DiagnosticCollection
) {
  context.subscriptions.push(
    commands.registerCommand(FIX_ALL_COMMAND, (packageJsonPath: string) =>
      executeAllFixCommand(
        outputChannel,
        packageJsonPath,
        dependencyIssuesDiagnosticCollection
      )
    )
  );
}

async function executeAllFixCommand(
  outputChannel: OutputChannel,
  packageJsonPath: string,
  dependencyIssuesDiagnosticCollection: DiagnosticCollection
): Promise<void> {
  outputChannel.show(true);

  const npmCommand = "install";
  try {
    outputChannel.appendLine(`\nFixing dependency issues ...`);
    const start = Date.now();
    const config = { commandArgs: [npmCommand], cwd: dirname(packageJsonPath) };
    await invokeNPMCommand(config, outputChannel);

    outputChannel.append(`Done. (${Date.now() - start} millis)\n`);

    void refreshPackageJsonDiagnostics(
      packageJsonPath,
      dependencyIssuesDiagnosticCollection
    );
  } catch (error) {
    outputChannel.appendLine(`Failed: ${error.stack}`);
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
