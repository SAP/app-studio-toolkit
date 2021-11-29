import {
  Uri,
  ExtensionContext,
  workspace,
  window,
  languages,
  DiagnosticCollection,
  commands,
  OutputChannel,
} from "vscode";
import {
  NPMDependencyIssue,
  findDependencyIssues,
} from "@sap-devx/npm-dependencies-validation";
import { NPMIssuesActionProvider } from "./npmIssuesActionProvider";
import { subscribeToDocumentChanges } from "./diagnostics";
import { install, prune } from "./commands";

let dependencyIssuesDiagnosticCollection: DiagnosticCollection;

const PACKAGE_JSON = "package.json";
const PACKAGE_JSON_PATTERN = `**​/${PACKAGE_JSON}`;
const extName = "vscode-dependency-validation";

let outputChannel: OutputChannel;

export function activate(context: ExtensionContext) {
  outputChannel = window.createOutputChannel(extName);

  void findIssues();

  void addFileWatcher();

  // TODO: pattern does not work ???
  // const packageJsonFileSelector: DocumentSelector = { language: "json", pattern: PACKAGE_JSON_PATTERN };
  context.subscriptions.push(
    languages.registerCodeActionsProvider(
      "json",
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

  registerNpmCommands(context);
}

function registerNpmCommands(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(
      "deps.install",
      (depIssue: NPMDependencyIssue, packageJsonPath: string) =>
        install(
          outputChannel,
          depIssue,
          packageJsonPath,
          dependencyIssuesDiagnosticCollection
        )
    )
  );
  context.subscriptions.push(
    commands.registerCommand(
      "deps.prune",
      (depIssue: NPMDependencyIssue, packageJsonPath: string) =>
        prune(
          outputChannel,
          depIssue,
          packageJsonPath,
          dependencyIssuesDiagnosticCollection
        )
    )
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

  const problemDeps: NPMDependencyIssue[] = await findDependencyIssues(
    packageJsonUri.fsPath
  );

  void window.showInformationMessage(
    `found ${problemDeps.length} problems in ${Date.now() - start} milliseconds`
  );
}
