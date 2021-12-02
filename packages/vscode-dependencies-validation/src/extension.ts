import {
  Uri,
  ExtensionContext,
  workspace,
  window,
  languages,
  DiagnosticCollection,
  OutputChannel,
  commands,
  CodeActionKind,
} from "vscode";
import {
  NpmLsResult,
  findDependencyIssues,
} from "@sap-devx/npm-dependencies-validation";
import { NPMIssuesActionProvider } from "./npmIssuesActionProvider";
import { subscribeToDocumentChanges } from "./diagnostics";
import { fixAllDepIssuesCommand, FIX_ALL_ISSUES_COMMAND } from "./commands";

const PACKAGE_JSON = "package.json";
const PACKAGE_JSON_PATTERN = `**​/${PACKAGE_JSON}`;
const extName = "vscode-dependency-validation";

export function activate(context: ExtensionContext) {
  const outputChannel = window.createOutputChannel(extName);
  const diagnosticCollection = createDiagnosticCollection(context, extName);

  void findIssues();

  void addFileWatcher();

  registerCodeActionsProvider(context);

  subscribeToDocumentChanges(context, diagnosticCollection);

  registerCommands(context, outputChannel, diagnosticCollection);
}

function registerCodeActionsProvider(context: ExtensionContext): void {
  context.subscriptions.push(
    languages.registerCodeActionsProvider(
      { language: "json", scheme: "file", pattern: "**/package.json" },
      new NPMIssuesActionProvider(CodeActionKind.QuickFix),
      {
        providedCodeActionKinds: [CodeActionKind.QuickFix],
      }
    )
  );
}

function createDiagnosticCollection(
  context: ExtensionContext,
  extName: string
): DiagnosticCollection {
  const diagnosticCollection = languages.createDiagnosticCollection(extName);
  context.subscriptions.push(diagnosticCollection);
  return diagnosticCollection;
}

function registerCommands(
  context: ExtensionContext,
  outputChannel: OutputChannel,
  diagnosticCollection: DiagnosticCollection
): void {
  context.subscriptions.push(
    commands.registerCommand(
      FIX_ALL_ISSUES_COMMAND,
      (packageJsonPath: string) =>
        fixAllDepIssuesCommand(
          outputChannel,
          packageJsonPath,
          diagnosticCollection
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

  const npmLsResult: NpmLsResult = await findDependencyIssues(
    packageJsonUri.fsPath
  );

  void window.showInformationMessage(
    `found ${npmLsResult.problems?.length || 0} problems in ${
      Date.now() - start
    } milliseconds`
  );
}
