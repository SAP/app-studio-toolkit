import * as vscode from "vscode";
import { findDependencyIssues } from "@sap-devx/npm-dependencies-validation";
import { getDepIssueLocations, DependencyIssueLocation } from "./jsonParser";

/** Code that is used to associate package.json diagnostic entries with code actions. */
export const NPM_DEPENDENCY_ISSUE = "npm_dependency_issue";

/**
 * Analyzes the package.json text document for problems.
 * @param doc package.json text document to analyze
 * @param dependencyIssueDiagnostics diagnostic collection
 */
async function refreshDiagnostics(
  doc: vscode.TextDocument,
  dependencyIssueDiagnostics: vscode.DiagnosticCollection
): Promise<void> {
  const npmDependencyIssues = await findDependencyIssues(doc.uri);

  let diagnostics: vscode.Diagnostic[] = [];

  const issueLocations: DependencyIssueLocation[] = getDepIssueLocations(
    doc.getText(),
    npmDependencyIssues
  );

  issueLocations.forEach((issueLocation) => {
    const issueDiagnostics = createDiagnostic(issueLocation);
    diagnostics = diagnostics.concat(issueDiagnostics);
  });

  dependencyIssueDiagnostics.set(doc.uri, diagnostics);
}

function createDiagnostic(
  issueLocations: DependencyIssueLocation
): vscode.Diagnostic[] {
  const issueDiagnostics: vscode.Diagnostic[] = [];
  const { name, version } = issueLocations.npmDepIssue;

  const nameLine = issueLocations.keyPoint?.line;
  const nameColumn = issueLocations.keyPoint?.column;
  if (nameLine && nameColumn) {
    const nameRange = new vscode.Range(
      nameLine - 1,
      nameColumn,
      nameLine - 1,
      nameColumn + name.length
    );
    const nameMessage = `${name}', do you want to fix name?`;
    const nameDiagnostic = new vscode.Diagnostic(
      nameRange,
      nameMessage,
      vscode.DiagnosticSeverity.Information
    );
    nameDiagnostic.code = NPM_DEPENDENCY_ISSUE;
    issueDiagnostics.push(nameDiagnostic);
  }

  const versionLine = issueLocations.valuePoint?.line;
  const versionColumn = issueLocations.valuePoint?.column;
  if (versionLine && versionColumn) {
    const versionRange = new vscode.Range(
      versionLine - 1,
      versionColumn,
      versionLine - 1,
      versionColumn + version.length
    );
    const versionMessage = `${name} ${version}', do you want to fix version?`;
    const versionDiagnostic = new vscode.Diagnostic(
      versionRange,
      versionMessage,
      vscode.DiagnosticSeverity.Error
    );
    versionDiagnostic.code = NPM_DEPENDENCY_ISSUE;
    issueDiagnostics.push(versionDiagnostic);
  }

  return issueDiagnostics;
}

export function subscribeToDocumentChanges(
  context: vscode.ExtensionContext,
  dependencyIssueDiagnostics: vscode.DiagnosticCollection
): void {
  if (vscode.window.activeTextEditor) {
    void refreshDiagnostics(
      vscode.window.activeTextEditor.document,
      dependencyIssueDiagnostics
    );
  }

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        void refreshDiagnostics(editor.document, dependencyIssueDiagnostics);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(
      (e) => void refreshDiagnostics(e.document, dependencyIssueDiagnostics)
    )
  );

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((doc) =>
      dependencyIssueDiagnostics.delete(doc.uri)
    )
  );
}
