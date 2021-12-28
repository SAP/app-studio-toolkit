import type { DiagnosticCollection, Uri } from "vscode";
import { VscodeCommandsConfig, VscodeOutputChannel } from "./vscodeTypes";
import { FIX_ALL_ISSUES_COMMAND } from "./constants";
import { clearDiagnostics, fixDepsIssues } from "./util";

async function fixProjectDepsIssues(
  outputChannel: VscodeOutputChannel,
  diagnosticCollection: DiagnosticCollection,
  uri: Uri
): Promise<void> {
  // switched to output-channel only in manual mode
  outputChannel.show(true);
  await fixDepsIssues(uri, outputChannel);
  // TODO: assumes the fixing was successful, instead we should consider re-running the validation...
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

// TODO: consider in-lining this function
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
