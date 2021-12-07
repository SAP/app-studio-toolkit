import { clearDiagnostics, isNotInNodeModules } from "../util";
import type { DiagnosticCollection, Uri } from "vscode";
import {
  VscodeDepsIssuesConfig,
  VscodeOutputChannel,
  VscodeUriFile,
  VscodeWorkspace,
} from "../vscodeTypes";
import { isAutoFixEnabled } from "./configuration";
import { debouncedFindAndFixDepsIssues, findAndFixDepsIssues } from "./fixUtil";

// TODO: what should happen after git clone ??
export function addProjectsWatcher(vscodeConfig: VscodeDepsIssuesConfig): void {
  const { workspace, createUri, diagnosticCollection, outputChannel } =
    vscodeConfig;
  const fileWatcher = workspace.createFileSystemWatcher("**/{package.json}");

  fileWatcher.onDidChange((uri: Uri) =>
    onPackageJsonChangeEvent(
      uri,
      workspace,
      diagnosticCollection,
      createUri,
      outputChannel
    )
  );
  fileWatcher.onDidCreate((uri: Uri) =>
    onPackageJsonCreateEvent(
      uri,
      workspace,
      diagnosticCollection,
      createUri,
      outputChannel
    )
  );
}

async function onPackageJsonChangeEvent(
  uri: Uri,
  workspace: VscodeWorkspace,
  diagnosticCollection: DiagnosticCollection,
  createUri: VscodeUriFile,
  outputChannel: VscodeOutputChannel
): Promise<void> {
  const { fsPath } = uri;
  if (shouldFixProject(workspace, fsPath)) {
    await debouncedFindAndFixDepsIssues(fsPath, outputChannel);
    clearDiagnostics(diagnosticCollection, fsPath, createUri);
  }
}

async function onPackageJsonCreateEvent(
  uri: Uri,
  workspace: VscodeWorkspace,
  diagnosticCollection: DiagnosticCollection,
  createUri: VscodeUriFile,
  outputChannel: VscodeOutputChannel
): Promise<void> {
  const { fsPath } = uri;
  if (shouldFixProject(workspace, fsPath)) {
    await findAndFixDepsIssues(fsPath, outputChannel);
    clearDiagnostics(diagnosticCollection, fsPath, createUri);
  }
}

function shouldFixProject(
  workspace: VscodeWorkspace,
  packageJsonPath: string
): boolean {
  return isAutoFixEnabled(workspace) && isNotInNodeModules(packageJsonPath);
}
