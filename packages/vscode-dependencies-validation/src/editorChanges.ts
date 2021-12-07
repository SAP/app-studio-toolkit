import { refreshDiagnostics } from "./diagnostics";
import { clearDiagnostics } from "./util";
import { VscodePackageJsonChangesConfig } from "./vscodeTypes";

export function subscribeToPackageJsonChanges(
  vscodeConfig: VscodePackageJsonChangesConfig
): void {
  const { window, subscriptions, workspace, createUri, diagnosticCollection } =
    vscodeConfig;

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
