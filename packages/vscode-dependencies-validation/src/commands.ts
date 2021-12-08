import type { DiagnosticCollection, Uri } from "vscode";
import { VscodeCommandsConfig, VscodeOutputChannel } from "./vscodeTypes";
import { FIX_ALL_ISSUES_COMMAND } from "./constants";
import { clearDiagnostics, fixDepsIssues } from "./util";

async function fixProjectDepsIssues(
  outputChannel: VscodeOutputChannel,
  dependencyIssuesDiagnosticCollection: DiagnosticCollection,
  uri: Uri
): Promise<void> {
  // switched to outputchannel only in manual mode
  outputChannel.show(true);
  await fixDepsIssues(uri, outputChannel);
  clearDiagnostics(dependencyIssuesDiagnosticCollection, uri);
}

export function registerCommands(vscodeConfig: VscodeCommandsConfig): void {
  const { subscriptions, commands, outputChannel, diagnosticCollection } =
    vscodeConfig;
  subscriptions.push(
    commands.registerCommand(
      FIX_ALL_ISSUES_COMMAND,
      commandCallback(outputChannel, diagnosticCollection)
    )
  );
}

function commandCallback(
  outputChannel: VscodeOutputChannel,
  diagnosticCollection: DiagnosticCollection
) {
  return (uri: Uri) =>
    fixProjectDepsIssues(outputChannel, diagnosticCollection, uri);
}

export const internal = {
  fixProjectDepsIssues,
};
