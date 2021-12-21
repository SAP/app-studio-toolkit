import type {
  DiagnosticCollection,
  TextDocument,
  TextDocumentChangeEvent,
  TextEditor,
} from "vscode";
import { refreshDiagnostics } from "./diagnostics";
import { clearDiagnostics } from "./util";
import { VscodePackageJsonChangesConfig } from "./vscodeTypes";
import { isEmpty } from "lodash";

// TODO: when node_modules deleted or changed diagnostics are not refreshed and errors are not shown for an opened package.json
// the package.json file should be closed and opened again to trigger diagnostic refresh

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
      // TODO: this seems to be called **four** times for a simple newline added to package.json
      //       severe performance impact!?
      //       Consider debounce? perhaps at the level of the abs file path (from all events)?
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
    // The changeEvent seems to be invoked **four** times, yet only once with actual text changes.
    if (!isEmpty(event.contentChanges)) {
      void refreshDiagnostics(event.document.uri, diagnosticCollection);
    }
  };
}

function executeClearDiagnostics(diagnosticCollection: DiagnosticCollection) {
  return (doc: TextDocument) => clearDiagnostics(diagnosticCollection, doc.uri);
}
