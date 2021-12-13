import type { Uri } from "vscode";
import { PACKAGE_JSON_FILTER } from "../constants";
import { VscodeFileEventConfig } from "../vscodeTypes";
import { debouncedHandleProjectChange } from "./eventUtil";

export function addPackageJsonFileWatcher(
  vscodeConfig: VscodeFileEventConfig
): void {
  const fileWatcher =
    vscodeConfig.workspace.createFileSystemWatcher(PACKAGE_JSON_FILTER);

  fileWatcher.onDidChange(handleFileEvent(vscodeConfig));
  fileWatcher.onDidCreate(handleFileEvent(vscodeConfig));
}

function handleFileEvent(vscodeConfig: VscodeFileEventConfig): any {
  return (uri: Uri) => debouncedHandleProjectChange(uri, vscodeConfig);
}

export const internal = {
  handleFileEvent,
};
