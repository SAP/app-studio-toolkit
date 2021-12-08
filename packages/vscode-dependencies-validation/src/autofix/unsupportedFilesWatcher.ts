import type { Uri } from "vscode";
import { dirname, join } from "path";
import {
  yarnManagerFiles,
  pnpmManagerFiles,
  isPathExist,
} from "@sap-devx/npm-dependencies-validation";
import { handlePackageJsonEvent } from "./eventUtil";
import { VscodeFileEventConfig, VscodeUriFile } from "../vscodeTypes";

type UnsupportedFilesEvent = VscodeFileEventConfig & VscodeUriFile;

export function addUnsupportedFilesWatcher(
  vscodeConfig: UnsupportedFilesEvent
): void {
  const fileWatcher = vscodeConfig.workspace.createFileSystemWatcher(
    constructUnsupportedFilesPattern()
  );

  fileWatcher.onDidCreate((uri: Uri) =>
    onUnsupportedFileEvent(uri, vscodeConfig)
  );
  fileWatcher.onDidDelete((uri: Uri) =>
    onUnsupportedFileEvent(uri, vscodeConfig)
  );
}

async function onUnsupportedFileEvent(
  uri: Uri,
  vscodeConfig: UnsupportedFilesEvent
): Promise<void> {
  const packageJsonUri = createPackageJsonUri(uri, vscodeConfig);
  const pathExists = await isPathExist(packageJsonUri.fsPath);
  if (!pathExists) return;

  return handlePackageJsonEvent(packageJsonUri, vscodeConfig);
}

function createPackageJsonUri(uri: Uri, vscodeConfig: VscodeUriFile): Uri {
  return vscodeConfig.createUri(join(dirname(uri.fsPath), "package.json"));
}

function constructUnsupportedFilesPattern(): string {
  const unsupportedFiles = [...yarnManagerFiles, ...pnpmManagerFiles];
  return `**/{${unsupportedFiles.join(",")}}`;
}
