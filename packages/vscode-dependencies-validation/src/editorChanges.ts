import type {
  DiagnosticCollection,
  TextDocument,
  TextDocumentChangeEvent,
  TextEditor,
} from "vscode";
import { refreshDiagnostics } from "./diagnostics";
import { clearDiagnostics } from "./util";
import { VscodePackageJsonChangesConfig } from "./vscodeTypes";

export function subscribeToPackageJsonChanges(
  vscodeConfig: VscodePackageJsonChangesConfig
): void {
  const { window, subscriptions, workspace, diagnosticCollection } =
    vscodeConfig;

  if (window.activeTextEditor) {
    void refreshDiagnostics(
      window.activeTextEditor.document.uri,
      diagnosticCollection
    );
  }

  subscriptions.push(
    window.onDidChangeActiveTextEditor(
      executeRefreshDiagnosticsOnEditorChange(diagnosticCollection)
    )
  );

  subscriptions.push(
    workspace.onDidChangeTextDocument(
      executeRefreshDiagnosticsOnDocumentChangeEvent(diagnosticCollection)
    )
  );

  subscriptions.push(
    workspace.onDidCloseTextDocument(
      executeClearDiagnostics(diagnosticCollection)
    )
  );
}

function executeRefreshDiagnosticsOnEditorChange(
  diagnosticCollection: DiagnosticCollection
) {
  return (editor: TextEditor | undefined) => {
    if (editor) {
      void refreshDiagnostics(editor.document.uri, diagnosticCollection);
    }
  };
}

function executeRefreshDiagnosticsOnDocumentChangeEvent(
  diagnosticCollection: DiagnosticCollection
) {
  return (event: TextDocumentChangeEvent) => {
    void refreshDiagnostics(event.document.uri, diagnosticCollection);
  };
}

function executeClearDiagnostics(diagnosticCollection: DiagnosticCollection) {
  return (doc: TextDocument) => clearDiagnostics(diagnosticCollection, doc.uri);
}
