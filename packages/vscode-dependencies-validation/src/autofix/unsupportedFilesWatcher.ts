import type { DiagnosticCollection, Uri } from "vscode";
import { dirname, join } from "path";
import {
  yarnManagerFiles,
  pnpmManagerFiles,
  isPathExist,
} from "@sap-devx/npm-dependencies-validation";
import {
  VscodeDepsIssuesConfig,
  VscodeOutputChannel,
  VscodeUriFile,
  VscodeWorkspace,
} from "../vscodeTypes";
import { isAutoFixEnabled } from "./configuration";
import { findAndFixDepsIssues } from "./fixUtil";
import { clearDiagnostics, isNotInNodeModules } from "../util";

export function addUnsupportedFilesWatcher(
  vscodeConfig: VscodeDepsIssuesConfig
): void {
  const { workspace, createUri, diagnosticCollection, outputChannel } =
    vscodeConfig;
  const unsupportedFilesPattern = constructUnsupportedFilesPattern();
  const fileWatcher = workspace.createFileSystemWatcher(
    unsupportedFilesPattern
  );

  fileWatcher.onDidCreate((uri: Uri) =>
    onFileSystemEvent(
      uri,
      workspace,
      diagnosticCollection,
      createUri,
      outputChannel
    )
  );
  fileWatcher.onDidDelete((uri: Uri) =>
    onFileSystemEvent(
      uri,
      workspace,
      diagnosticCollection,
      createUri,
      outputChannel
    )
  );
}

function onFileSystemEvent(
  uri: Uri,
  workspace: VscodeWorkspace,
  diagnosticCollection: DiagnosticCollection,
  createUri: VscodeUriFile,
  outputChannel: VscodeOutputChannel
): void {
  const packageJsonPath = getPackageJsonPath(uri.fsPath);
  void shouldFixProject(workspace, packageJsonPath).then(async (shouldFix) => {
    if (shouldFix) {
      await findAndFixDepsIssues(packageJsonPath, outputChannel);
      clearDiagnostics(diagnosticCollection, packageJsonPath, createUri);
    }
  });
}

function getPackageJsonPath(filePath: string): string {
  return join(dirname(filePath), "package.json");
}

function constructUnsupportedFilesPattern(): string {
  const unsupportedFiles = [...yarnManagerFiles, ...pnpmManagerFiles];
  return `**/{${unsupportedFiles.join(",")}}`;
}

async function shouldFixProject(
  workspace: VscodeWorkspace,
  packageJsonPath: string
): Promise<boolean> {
  const pathExists = await isPathExist(packageJsonPath);
  if (!pathExists) return false;

  return isAutoFixEnabled(workspace) && isNotInNodeModules(packageJsonPath);
}
