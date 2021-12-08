import type { DiagnosticCollection, Uri } from "vscode";
import { VscodeCommandsConfig, VscodeOutputChannel } from "./vscodeTypes";
import { FIX_ALL_ISSUES_COMMAND } from "./constants";
import { clearDiagnostics, fixDepsIssues } from "./util";

async function fixAllDepIssuesCommand(
  outputChannel: VscodeOutputChannel,
  dependencyIssuesDiagnosticCollection: DiagnosticCollection,
  uri: Uri
): Promise<void> {
  // switched to outputchannel only in manual mode
  outputChannel.show(true);

  try {
    await fixDepsIssues(uri, outputChannel);

    clearDiagnostics(dependencyIssuesDiagnosticCollection, uri);
  } catch (error) {
    outputChannel.appendLine(`Command Failed: ${error.stack}`);
  }
}

export function registerCommands(vscodeConfig: VscodeCommandsConfig): void {
  const { subscriptions, commands, outputChannel, diagnosticCollection } =
    vscodeConfig;
  subscriptions.push(
    commands.registerCommand(FIX_ALL_ISSUES_COMMAND, (uri: Uri) =>
      fixAllDepIssuesCommand(outputChannel, diagnosticCollection, uri)
    )
  );
}

export const internal = {
  fixAllDepIssuesCommand,
};
