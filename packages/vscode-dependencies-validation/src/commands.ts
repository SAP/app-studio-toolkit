import type { DiagnosticCollection, Uri } from "vscode";
import { VscodeCommandsConfig, VscodeOutputChannel } from "./vscodeTypes";
import { FIX_ALL_ISSUES_COMMAND } from "./constants";
import { clearDiagnostics } from "./util";
import { fixDependencyIssues } from "@sap-devx/npm-dependencies-validation";

async function fixProjectDepsIssues(
  outputChannel: VscodeOutputChannel,
  diagnosticCollection: DiagnosticCollection,
  uri: Uri
): Promise<void> {
  // switched to outputchannel only in manual mode
  outputChannel.show(true);
  await fixDependencyIssues(uri.fsPath, outputChannel);
  clearDiagnostics(diagnosticCollection, uri);
}

// commands for manual fix of dependency issues
export function registerCommands(vscodeConfig: VscodeCommandsConfig): void {
  const { subscriptions, commands, outputChannel, diagnosticCollection } =
    vscodeConfig;
  subscriptions.push(
    commands.registerCommand(
      FIX_ALL_ISSUES_COMMAND,
      executeFixProjectDepsIssues(outputChannel, diagnosticCollection)
    )
  );
}

function executeFixProjectDepsIssues(
  outputChannel: VscodeOutputChannel,
  diagnosticCollection: DiagnosticCollection
) {
  return (uri: Uri) =>
    fixProjectDepsIssues(outputChannel, diagnosticCollection, uri);
}

export const internal = {
  fixProjectDepsIssues,
  executeFixProjectDepsIssues,
};
