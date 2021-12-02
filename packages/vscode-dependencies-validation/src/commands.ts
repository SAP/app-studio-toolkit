import { dirname } from "path";
import type { DiagnosticCollection, OutputChannel } from "vscode";
import { invokeNPMCommand } from "@sap-devx/npm-dependencies-validation";
import { refreshDiagnostics } from "./diagnostics";
import { VscodeOutputChannel } from "./vscodeTypes";

export const FIX_ALL_ISSUES_COMMAND = "fix.all.dependency.issues.command";

export async function fixAllDepIssuesCommand(
  outputChannel: VscodeOutputChannel,
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

async function refreshPackageJsonDiagnostics(
  packageJsonPath: string,
  dependencyIssuesDiagnosticCollection: DiagnosticCollection
): Promise<void> {
  await refreshDiagnostics(
    packageJsonPath,
    dependencyIssuesDiagnosticCollection
  );
}
