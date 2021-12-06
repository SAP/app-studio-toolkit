import { dirname } from "path";
import type { DiagnosticCollection, OutputChannel } from "vscode";
import { invokeNPMCommand } from "@sap-devx/npm-dependencies-validation";
import { refreshDiagnostics } from "./diagnostics";
import { VscodeOutputChannel } from "./vscodeTypes";

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
    const millis = Date.now() - start;
    outputChannel.append(`Done. (${millisToSeconds(millis)} seconds)\n`);

    void refreshDiagnostics(
      packageJsonPath,
      dependencyIssuesDiagnosticCollection
    );
  } catch (error) {
    outputChannel.appendLine(`Failed: ${error.stack}`);
  }
}

function millisToSeconds(millis: number): string {
  return ((millis % 60000) / 1000).toFixed(2);
}
