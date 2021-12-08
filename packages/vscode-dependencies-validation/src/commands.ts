import type { DiagnosticCollection, Uri } from "vscode";
import { dirname } from "path";
import { refreshDiagnostics } from "./diagnostics";
import { VscodeCommandsConfig, VscodeOutputChannel } from "./vscodeTypes";
import { FIX_ALL_ISSUES_COMMAND } from "./constants";
import { fixDepsIssues } from "./util";

async function fixAllDepIssuesCommand(
  outputChannel: VscodeOutputChannel,
  dependencyIssuesDiagnosticCollection: DiagnosticCollection,
  uri: Uri
): Promise<void> {
  // TODO: disable for autofix ???
  outputChannel.show(true);

  try {
    outputChannel.appendLine(
      `\nFixing dependency issues of ${dirname(uri.fsPath)} ...`
    );

    await fixDepsIssues(uri, outputChannel);

    outputChannel.appendLine(`\nRefreshing dependency issues diagnostics ...`);
    await refreshDiagnostics(uri, dependencyIssuesDiagnosticCollection);
    outputChannel.appendLine(`Done.\n`);
  } catch (error) {
    outputChannel.appendLine(`Failed: ${error.stack}`);
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
