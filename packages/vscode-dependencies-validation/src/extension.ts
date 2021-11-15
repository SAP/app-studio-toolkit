import { getDependencyIssues } from "@sap-devx/npm-dependecies-validation";
import { DependencyIssue } from "@sap-devx/npm-dependecies-validation/dist/types";
import { Uri, commands, ExtensionContext, workspace, window } from "vscode";

const PACKAGE_JSON = "package.json";

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(
      "vscode-dependencies-validation.findPackageJsons",
      async () => {
        const packageJsonUris: Uri[] = await workspace.findFiles(
          PACKAGE_JSON,
          "**​/node_modules/**"
        );
        packageJsonUris.forEach((packageJsonUri) => {
          void displayProblematicDependencies(packageJsonUri);
        });
      }
    )
  );
}

async function displayProblematicDependencies(
  packageJsonUri: Uri
): Promise<void> {
  const start = Date.now();

  const location = packageJsonUri.fsPath.substring(
    0,
    packageJsonUri.fsPath.length - PACKAGE_JSON.length
  );
  const problemDeps: DependencyIssue[] = await getDependencyIssues(location);

  const finish = Date.now();

  window.showInformationMessage(
    `found ${problemDeps.length} problems in ${finish - start} millis`
  );
}
