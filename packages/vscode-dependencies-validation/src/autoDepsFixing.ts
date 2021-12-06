import type { Uri, WorkspaceConfiguration } from "vscode";
import { workspace } from "vscode";
import { isEmpty, debounce } from "lodash";
import { dirname } from "path";
import {
  invokeNPMCommand,
  findDependencyIssues,
} from "@sap-devx/npm-dependencies-validation";
import { isAutoDepsFixingEnabled, getTimeoutOnActivate } from "./configuration";
import { PACKAGE_JSON_PATTERN } from "./constants";

export function setAutoDepsFixing(wsConfig: WorkspaceConfiguration): void {
  setTimeout(() => {
    if (isAutoDepsFixingEnabled(wsConfig)) {
      void executeAutoDepsFixing();
    }
  }, getTimeoutOnActivate(wsConfig));

  addFileWatcher(wsConfig);
}

function getPackageJsonUris(): Thenable<Uri[]> {
  return workspace.findFiles("package.json", "**​/node_modules/**");
}

async function executeAutoDepsFixing(): Promise<void> {
  const packageJsonUris = await getPackageJsonUris();
  packageJsonUris.forEach(({ fsPath }) => {
    void findAndFixDepsIssues(fsPath);
  });
}

async function findAndFixDepsIssues(packageJsonPath: string): Promise<void> {
  const { problems } = await findDependencyIssues(packageJsonPath);
  if (isEmpty(problems)) return;

  // TODO: what about output channel in case of automatic fixing ???
  return invokeNPMCommand({
    commandArgs: ["install"],
    cwd: dirname(packageJsonPath),
  });
}

const debouncFindAndFixDepsIssues = debounce(findAndFixDepsIssues, 3000);

// TODO: need to add file watcher for unsupported package manager files and properties
// TODO: somebody added yarl.lock in filesystem (not via vscode) ??
// TODO: what should happen after git clone ??
function addFileWatcher(wsConfig: WorkspaceConfiguration): void {
  const fileWatcher = workspace.createFileSystemWatcher("**/package.json"); // TODO: PACKAGE_JSON_PATTERN does not work here ???
  fileWatcher.onDidChange((uri: Uri) => {
    if (shouldCheckPackageJson(wsConfig, uri.fsPath)) {
      void debouncFindAndFixDepsIssues(uri.fsPath);
    }
  });

  fileWatcher.onDidCreate((uri: Uri) => {
    if (shouldCheckPackageJson(wsConfig, uri.fsPath)) {
      void findAndFixDepsIssues(uri.fsPath);
    }
  });

  fileWatcher.onDidDelete((uri: Uri) => {
    //TODO: check if we need it ??
    if (shouldCheckPackageJson(wsConfig, uri.fsPath)) {
      void findAndFixDepsIssues(uri.fsPath);
    }
  });
}

function isPackageJsonNotInNodeModules(packageJsonPath: string): boolean {
  return PACKAGE_JSON_PATTERN.test(packageJsonPath);
}

function shouldCheckPackageJson(
  wsConfig: WorkspaceConfiguration,
  packageJsonPath: string
): boolean {
  return (
    isAutoDepsFixingEnabled(wsConfig) &&
    isPackageJsonNotInNodeModules(packageJsonPath)
  );
}
