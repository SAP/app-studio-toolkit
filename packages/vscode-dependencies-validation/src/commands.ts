import { dirname } from "path";
import type { DiagnosticCollection } from "vscode";
import { invokeNPMCommand } from "@sap-devx/npm-dependencies-validation";
import { refreshDiagnostics } from "./diagnostics";
import {
  VscodeConfig,
  VscodeOutputChannel,
} from "./vscodeTypes";
import { FIX_ALL_ISSUES_COMMAND } from "./constants";

async function fixAllDepIssuesCommand(
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

export function registerCommands(
  vscodeConfig: VscodeConfig
): void {
  const { subscriptions, commands, outputChannel, diagnosticCollection } = vscodeConfig;
  subscriptions.push(
    commands.registerCommand(
      FIX_ALL_ISSUES_COMMAND,
      (packageJsonPath: string) =>
        fixAllDepIssuesCommand(
          outputChannel,
          packageJsonPath,
          diagnosticCollection
        )
    )
  );
}

export const internal = {
  fixAllDepIssuesCommand,
};
