import {
  Uri,
  ExtensionContext,
  workspace,
  window,
  languages,
  DiagnosticCollection,
  OutputChannel,
} from "vscode";
import {
  NpmLsResult,
  findDependencyIssues,
} from "@sap-devx/npm-dependencies-validation";
import { NPMIssuesActionProvider } from "./npmIssuesActionProvider";
import { subscribeToDocumentChanges } from "./diagnostics";
import { registerFixCommand } from "./commands";

let dependencyIssuesDiagnosticCollection: DiagnosticCollection;

const PACKAGE_JSON = "package.json";
const PACKAGE_JSON_PATTERN = `**​/${PACKAGE_JSON}`;
const extName = "vscode-dependency-validation";

let outputChannel: OutputChannel;

export function activate(context: ExtensionContext) {
  outputChannel = window.createOutputChannel(extName);

  void findIssues();

  void addFileWatcher();

  context.subscriptions.push(
    languages.registerCodeActionsProvider(
      { language: "json", scheme: "file", pattern: "**/package.json" },
      new NPMIssuesActionProvider(),
      {
        providedCodeActionKinds:
          NPMIssuesActionProvider.providedCodeActionKinds,
      }
    )
  );

  dependencyIssuesDiagnosticCollection =
    languages.createDiagnosticCollection(extName);
  context.subscriptions.push(dependencyIssuesDiagnosticCollection);

  subscribeToDocumentChanges(context, dependencyIssuesDiagnosticCollection);

  registerFixCommand(
    context,
    outputChannel,
    dependencyIssuesDiagnosticCollection
  );
}

// TODO: need to add file watcher for unsupported package manager files and properties
async function findIssues(): Promise<void> {
  const packageJsonUris: Uri[] = await workspace.findFiles(
    PACKAGE_JSON,
    "**​/node_modules/**"
  );
  packageJsonUris.forEach((packageJsonUri) => {
    void displayProblematicDependencies(packageJsonUri);
  });
}

// TODO: somebody added yarl.lock in filesystem (not via vscode) ??
// TODO: what should happen after git clone ??
function addFileWatcher(): void {
  const fileWatcher = workspace.createFileSystemWatcher(PACKAGE_JSON_PATTERN);
  fileWatcher.onDidChange((uri: Uri) => {
    void displayProblematicDependencies(uri);
  });

  fileWatcher.onDidCreate((uri: Uri) => {
    void displayProblematicDependencies(uri);
  });

  fileWatcher.onDidDelete((uri: Uri) => {
    //TODO: check if we need it ??
    void displayProblematicDependencies(uri);
  });
}

async function displayProblematicDependencies(
  packageJsonUri: Uri
): Promise<void> {
  const start = Date.now();

  const npmLsResult: NpmLsResult = await findDependencyIssues(
    packageJsonUri.fsPath
  );

  void window.showInformationMessage(
    `found ${npmLsResult.problems?.length || 0} problems in ${
      Date.now() - start
    } milliseconds`
  );
}
