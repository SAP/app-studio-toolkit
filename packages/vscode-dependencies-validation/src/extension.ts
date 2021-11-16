import { getDependencyIssues } from "@sap-devx/npm-dependencies-validation/dist/src";
import { DependencyIssue } from "@sap-devx/npm-dependencies-validation/dist/src/types";

import { Uri, commands, ExtensionContext, workspace, window } from "vscode";
import { basename, dirname } from "path";

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(
      "vscode-dependencies-validation.displayIssues",
      async () => {
        const packageJsonUris: Uri[] = await workspace.findFiles(
          "package.json",
          "**​/node_modules/**"
        );
        packageJsonUris.forEach((packageJsonUri) => {
          displayProblematicDependencies(packageJsonUri);
        });
      }
    )
  );
}

function displayProblematicDependencies(packageJsonUri: Uri): void {
  const start = Date.now();
  const location = basename(dirname(packageJsonUri.fsPath));
  void getDependencyIssues(location).then((problemDeps: DependencyIssue[]) => {
    const finish = Date.now();

    void window.showInformationMessage(
      `found ${problemDeps.length} problems in ${finish - start} millis`
    );
  });
}
