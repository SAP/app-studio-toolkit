import {
  Uri,
  ExtensionContext,
  workspace,
  window,
  languages,
  DiagnosticCollection,
  DocumentSelector,
} from "vscode";
import {
  NPMDependencyIssue,
  findDependencyIssues,
} from "@sap-devx/npm-dependencies-validation";
import { NPMIssuesActionProvider } from "./npmIssuesActionProvider";
import { subscribeToDocumentChanges } from "./diagnostics";

let dependencyIssuesDiagnosticCollection: DiagnosticCollection;

const PACKAGE_JSON = "package.json";
const PACKAGE_JSON_PATTERN = `**​/${PACKAGE_JSON}`;

export function activate(context: ExtensionContext) {
  void findIssues();

  void addFileWatcher();

  dependencyIssuesDiagnosticCollection = languages.createDiagnosticCollection(
    "npm-dependency-issues"
  );
  context.subscriptions.push(dependencyIssuesDiagnosticCollection);
  // TODO: pattern does not work ???
  // const packageJsonFileSelector: DocumentSelector = { language: "json", pattern: PACKAGE_JSON_PATTERN };
  context.subscriptions.push(
    languages.registerCodeActionsProvider(
      PACKAGE_JSON,
      new NPMIssuesActionProvider(),
      {
        providedCodeActionKinds:
          NPMIssuesActionProvider.providedCodeActionKinds,
      }
    )
  );

  subscribeToDocumentChanges(context, dependencyIssuesDiagnosticCollection);
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

  const problemDeps: NPMDependencyIssue[] = await findDependencyIssues(
    packageJsonUri
  );

  void window.showInformationMessage(
    `found ${problemDeps.length} problems in ${Date.now() - start} milliseconds`
  );
}
