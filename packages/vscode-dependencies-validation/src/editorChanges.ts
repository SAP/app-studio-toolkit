import type {
  DiagnosticCollection,
  TextDocument,
  TextDocumentChangeEvent,
  TextEditor,
} from "vscode";
import { isEmpty } from "lodash";
import { clearDiagnostics } from "./util";
import { VscodePackageJsonChangesConfig } from "./vscodeTypes";
import { getOptimizedRefreshDiagnostics } from "./diagnostics/debounce";
import { shouldBeChecked } from "./diagnostics/shouldBeChecked";

// TODO: when node_modules deleted or changed diagnostics are not refreshed and errors are not shown for an opened package.json
// the package.json file should be closed and opened again to trigger diagnostic refresh

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
    if (editor && shouldBeChecked(editor.document.uri.path)) {
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
    const uri = event.document.uri;

    if (
      // this event gets called multiple (four) times for each text change
      // but only once for "true" text changes
      !isEmpty(event.contentChanges) &&
      shouldBeChecked(uri.path)
    ) {
      const optimizedRefreshDiag = getOptimizedRefreshDiagnostics(uri);
      void optimizedRefreshDiag(uri, diagnosticCollection);
    }
  };
}

function executeClearDiagnostics(diagnosticCollection: DiagnosticCollection) {
  return (doc: TextDocument) => clearDiagnostics(diagnosticCollection, doc.uri);
}
