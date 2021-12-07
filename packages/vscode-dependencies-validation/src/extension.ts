import {
  ExtensionContext,
  workspace,
  window,
  languages,
  DiagnosticCollection,
  OutputChannel,
  commands,
  CodeActionKind,
} from "vscode";
import { NPMIssuesActionProvider } from "./npmIssuesActionProvider";
import { fixAllDepIssuesCommand } from "./commands";
import { FIX_ALL_ISSUES_COMMAND } from "./constants";
import { refreshDiagnostics } from "./diagnostics";
import { activateDepsIssuesAutoFix } from "./autofix/depsIssues";
import { ContextSubscriptions } from "./vscodeTypes";

export function activate(context: ExtensionContext): void {
  const {
    extension: { id: extId },
    subscriptions,
  } = context;

  const outputChannel = window.createOutputChannel(extId);
  const diagnosticCollection = createDiagnosticCollection(context, extId);

  registerCodeActionsProvider(subscriptions);

  subscribeToDocumentChanges(subscriptions, diagnosticCollection);

  registerCommands(subscriptions, outputChannel, diagnosticCollection);

  activateDepsIssuesAutoFix(workspace);
}

function registerCodeActionsProvider(
  subscriptions: ContextSubscriptions
): void {
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
  subscriptions: ContextSubscriptions,
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

function subscribeToDocumentChanges(
  subscriptions: ContextSubscriptions,
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
