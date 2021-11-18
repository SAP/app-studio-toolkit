import {
  getDependencyIssues,
  DependencyIssue,
} from "@sap-devx/npm-dependencies-validation";

import { Uri, ExtensionContext, workspace, window } from "vscode";

export function activate(context: ExtensionContext) {
  void findIssues();

  void addFileWatcher();
}

async function findIssues(): Promise<void> {
  const packageJsonUris: Uri[] = await workspace.findFiles(
    "package.json",
    "**​/node_modules/**"
  );
  packageJsonUris.forEach((packageJsonUri) => {
    void displayProblematicDependencies(packageJsonUri);
  });
}

function addFileWatcher(): void {
  const fileWatcher = workspace.createFileSystemWatcher("**/package.json");
  fileWatcher.onDidChange((uri: Uri) => {
    void displayProblematicDependencies(uri);
  });

  fileWatcher.onDidCreate((uri: Uri) => {
    void displayProblematicDependencies(uri);
  });

  fileWatcher.onDidDelete((uri: Uri) => {
    void displayProblematicDependencies(uri);
  });
}

async function displayProblematicDependencies(
  packageJsonUri: Uri
): Promise<void> {
  const start = Date.now();

  const problemDeps: DependencyIssue[] = await getDependencyIssues(
    workspace.workspaceFolders,
    packageJsonUri
  );

  const finish = Date.now();

  void window.showInformationMessage(
    `found ${problemDeps.length} problems in ${finish - start} millis`
  );
}
