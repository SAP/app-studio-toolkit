import { clearDiagnostics, isNotInNodeModules } from "../util";
import type { DiagnosticCollection, Uri } from "vscode";
import { VscodeUriFile, VscodeWorkspace } from "../vscodeTypes";
import { isAutoFixEnabled } from "./configuration";
import { debouncedFindAndFixDepsIssues, findAndFixDepsIssues } from "./fixUtil";

// TODO: what should happen after git clone ??
export function addProjectsWatcher(
  workspace: VscodeWorkspace,
  diagnosticCollection: DiagnosticCollection,
  createUri: VscodeUriFile
): void {
  const fileWatcher = workspace.createFileSystemWatcher("**/{package.json}");

  fileWatcher.onDidChange((uri: Uri) =>
    onPackageJsonChangeEvent(uri, workspace, diagnosticCollection, createUri)
  );
  fileWatcher.onDidCreate((uri: Uri) =>
    onPackageJsonCreateEvent(uri, workspace, diagnosticCollection, createUri)
  );
}

async function onPackageJsonChangeEvent(
  uri: Uri,
  workspace: VscodeWorkspace,
  diagnosticCollection: DiagnosticCollection,
  createUri: VscodeUriFile
): Promise<void> {
  const { fsPath } = uri;
  if (shouldFixProject(workspace, fsPath)) {
    await debouncedFindAndFixDepsIssues(fsPath);
    clearDiagnostics(diagnosticCollection, fsPath, createUri);
  }
}

async function onPackageJsonCreateEvent(
  uri: Uri,
  workspace: VscodeWorkspace,
  diagnosticCollection: DiagnosticCollection,
  createUri: VscodeUriFile
): Promise<void> {
  const { fsPath } = uri;
  if (shouldFixProject(workspace, fsPath)) {
    await findAndFixDepsIssues(fsPath);
    clearDiagnostics(diagnosticCollection, fsPath, createUri);
  }
}

function shouldFixProject(
  workspace: VscodeWorkspace,
  packageJsonPath: string
): boolean {
  return isAutoFixEnabled(workspace) && isNotInNodeModules(packageJsonPath);
}
