import type { DiagnosticCollection } from "vscode";
import { refreshDiagnostics } from "./diagnostics";
import { clearDiagnostics } from "./util";
import { VscodeConfig } from "./vscodeTypes";

export function subscribeToPackageJsonChanges(
  vscodeConfig: VscodeConfig,
  diagnosticCollection: DiagnosticCollection
): void {
  const { window, subscriptions, workspace, createUri } = vscodeConfig;

  if (window.activeTextEditor) {
    void refreshDiagnostics(
      window.activeTextEditor.document.uri.fsPath,
      diagnosticCollection
    );
  }

  subscriptions.push(
    window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        void refreshDiagnostics(
          editor.document.uri.fsPath,
          diagnosticCollection
        );
      }
    })
  );

  subscriptions.push(
    workspace.onDidChangeTextDocument(
      (e) =>
        void refreshDiagnostics(e.document.uri.fsPath, diagnosticCollection)
    )
  );

  subscriptions.push(
    workspace.onDidCloseTextDocument((doc) =>
      clearDiagnostics(diagnosticCollection, doc.uri.fsPath, createUri)
    )
  );
}
