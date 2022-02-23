import type {
  DiagnosticCollection,
  TextDocument,
  TextDocumentChangeEvent,
  TextEditor,
} from "vscode";
import { clearDiagnostics } from "./util";
import { VscodePackageJsonChangesConfig } from "./vscodeTypes";
import { getOptimizedRefreshDiagnostics } from "./diagnostics/debounce";
import { shouldBeChecked } from "./diagnostics/shouldBeChecked";
import { isNewPersistedFileVersion } from "./diagnostics/isNewPersistedFileVersion";

export function subscribeToPackageJsonChanges(
  vscodeConfig: VscodePackageJsonChangesConfig
): void {
  const { window, subscriptions, workspace, diagnosticCollection } =
    vscodeConfig;
  if (
    window.activeTextEditor &&
    shouldBeChecked(window.activeTextEditor.document.uri.path)
  ) {
    const uri = window.activeTextEditor.document.uri;
    const optimizedRefreshDiag = getOptimizedRefreshDiagnostics(uri);
    void optimizedRefreshDiag(uri, diagnosticCollection);
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
    if (
      editor &&
      shouldBeChecked(editor.document.uri.path) &&
      !editor.document.isDirty
    ) {
      {
        const uri = editor.document.uri;
        const optimizedRefreshDiag = getOptimizedRefreshDiagnostics(uri);
        void optimizedRefreshDiag(uri, diagnosticCollection);
      }
    }
  };
}

function executeRefreshDiagnosticsOnDocumentChangeEvent(
  diagnosticCollection: DiagnosticCollection
) {
  return (event: TextDocumentChangeEvent) => {
    const document = event.document;
    const uri = document.uri;

    if (
      shouldBeChecked(uri.path) &&
      !document.isDirty &&
      // this check should be last as it may modify global state (path -> version cache)
      isNewPersistedFileVersion(uri.path, document.version)
    ) {
      const optimizedRefreshDiag = getOptimizedRefreshDiagnostics(uri);
      void optimizedRefreshDiag(uri, diagnosticCollection);
    }
  };
}

function executeClearDiagnostics(diagnosticCollection: DiagnosticCollection) {
  return (doc: TextDocument) => clearDiagnostics(diagnosticCollection, doc.uri);
}
