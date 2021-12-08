import type { Uri } from "vscode";
import { debounce } from "lodash";
import { VscodeFileEventConfig } from "../vscodeTypes";
import { handlePackageJsonEvent } from "./eventUtil";

const debouncedHandlePackageJsonEvent = debounce(handlePackageJsonEvent, 3000);

// TODO: what should happen after git clone ??
export function addPackageJsonFileWatcher(
  vscodeConfig: VscodeFileEventConfig
): void {
  const fileWatcher =
    vscodeConfig.workspace.createFileSystemWatcher("**/package.json");

  fileWatcher.onDidChange((uri: Uri) =>
    debouncedHandlePackageJsonEvent(uri, vscodeConfig)
  );
  fileWatcher.onDidCreate((uri: Uri) =>
    handlePackageJsonEvent(uri, vscodeConfig)
  );
}
