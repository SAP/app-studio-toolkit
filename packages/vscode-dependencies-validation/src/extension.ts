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
import { debounce } from "lodash";
import { NPMIssuesActionProvider } from "./npmIssuesActionProvider";
import { fixAllDepIssuesCommand } from "./commands";
import { FIX_ALL_ISSUES_COMMAND, PACKAGE_JSON_PATTERN } from "./constants";
import { refreshDiagnostics } from "./diagnostics";

type Subscriptions = ExtensionContext["subscriptions"];

export function activate(context: ExtensionContext): void {
  const {
    extension: { id: extId },
    subscriptions,
  } = context;

  const outputChannel = window.createOutputChannel(extId);
  const diagnosticCollection = createDiagnosticCollection(context, extId);

  void findIssues();

  void addFileWatcher();

  registerCodeActionsProvider(subscriptions);

  subscribeToDocumentChanges(subscriptions, diagnosticCollection);

  registerCommands(subscriptions, outputChannel, diagnosticCollection);
}

function registerCodeActionsProvider(subscriptions: Subscriptions): void {
  subscriptions.push(
    languages.registerCodeActionsProvider(
      { language: "json", scheme: "file", pattern: "**/package.json" }, // TODO: PACKAGE_JSON_PATTERN does not work here ???
      new NPMIssuesActionProvider(CodeActionKind.QuickFix),
      {
        providedCodeActionKinds: [CodeActionKind.QuickFix],
      }
    )
  );
}

function createDiagnosticCollection(
  context: ExtensionContext,
  extId: string
): DiagnosticCollection {
  const diagnosticCollection = languages.createDiagnosticCollection(extId);
  context.subscriptions.push(diagnosticCollection);
  return diagnosticCollection;
}

function registerCommands(
  subscriptions: Subscriptions,
  outputChannel: OutputChannel,
  diagnosticCollection: DiagnosticCollection
): void {
  subscriptions.push(
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
    "package.json",
    "**​/node_modules/**"
  );
  packageJsonUris.forEach((packageJsonUri) => {
    void displayProblematicDependencies(packageJsonUri);
  });
}

const debouncedDisplayProblematicDependencies = debounce(
  displayProblematicDependencies,
  3000
);

// TODO: somebody added yarl.lock in filesystem (not via vscode) ??
// TODO: what should happen after git clone ??
function addFileWatcher(): void {
  const fileWatcher = workspace.createFileSystemWatcher("**/package.json"); // TODO: PACKAGE_JSON_PATTERN does not work here ???
  fileWatcher.onDidChange((uri: Uri) => {
    void debouncedDisplayProblematicDependencies(uri);
  });

  fileWatcher.onDidCreate((uri: Uri) => {
    void debouncedDisplayProblematicDependencies(uri);
  });

  fileWatcher.onDidDelete((uri: Uri) => {
    //TODO: check if we need it ??
    void debouncedDisplayProblematicDependencies(uri);
  });
}

async function displayProblematicDependencies(
  packageJsonUri: Uri
): Promise<void> {
  if (PACKAGE_JSON_PATTERN.test(packageJsonUri.fsPath)) {
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
}

function subscribeToDocumentChanges(
  subscriptions: Subscriptions,
  dependencyIssueDiagnostics: DiagnosticCollection
): void {
  if (window.activeTextEditor) {
    void refreshDiagnostics(
      window.activeTextEditor.document.uri.fsPath,
      dependencyIssueDiagnostics
    );
  }

  subscriptions.push(
    window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        void refreshDiagnostics(
          editor.document.uri.fsPath,
          dependencyIssueDiagnostics
        );
      }
    })
  );

  subscriptions.push(
    workspace.onDidChangeTextDocument(
      (e) =>
        void refreshDiagnostics(
          e.document.uri.fsPath,
          dependencyIssueDiagnostics
        )
    )
  );

  subscriptions.push(
    workspace.onDidCloseTextDocument((doc) =>
      dependencyIssueDiagnostics.delete(doc.uri)
    )
  );
}
