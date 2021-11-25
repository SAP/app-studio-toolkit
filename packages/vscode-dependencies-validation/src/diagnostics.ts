import {
  Diagnostic,
  DiagnosticSeverity,
  DiagnosticCollection,
  TextDocument,
  Range,
  window,
  ExtensionContext,
  workspace,
} from "vscode";
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
  doc: TextDocument,
  dependencyIssueDiagnostics: DiagnosticCollection
): Promise<void> {
  const npmDependencyIssues = await findDependencyIssues(doc.uri.fsPath);

  let diagnostics: Diagnostic[] = [];

  const issueLocations: DependencyIssueLocation[] = getDepIssueLocations(
    doc.getText(),
    npmDependencyIssues
  );

  issueLocations.forEach((issueLocation) => {
    const issueDiagnostics = createDiagnostic(issueLocation);
    diagnostics = [...diagnostics, ...issueDiagnostics];
  });

  dependencyIssueDiagnostics.set(doc.uri, diagnostics);
}

function createDiagnostic(
  issueLocations: DependencyIssueLocation
): Diagnostic[] {
  const issueDiagnostics: Diagnostic[] = [];
  const { name, version } = issueLocations.npmDepIssue;

  const nameLine = issueLocations.namePoint.line;
  const nameColumn = issueLocations.namePoint.column;
  if (nameLine && nameColumn) {
    const nameRange = new Range(
      nameLine - 1,
      nameColumn,
      nameLine - 1,
      nameColumn + name.length
    );
    const nameMessage = `${name}', do you want to fix name?`;
    const nameDiagnostic = new Diagnostic(
      nameRange,
      nameMessage,
      DiagnosticSeverity.Information
    );
    nameDiagnostic.code = NPM_DEPENDENCY_ISSUE;
    issueDiagnostics.push(nameDiagnostic);
  }

  const versionLine = issueLocations.versionPoint.line;
  const versionColumn = issueLocations.versionPoint.column;
  if (versionLine && versionColumn) {
    const versionRange = new Range(
      versionLine - 1,
      versionColumn,
      versionLine - 1,
      versionColumn + issueLocations.actualVersion.length
    );
    const versionMessage = `${name} ${version}', do you want to fix version?`;
    const versionDiagnostic = new Diagnostic(
      versionRange,
      versionMessage,
      DiagnosticSeverity.Error
    );
    versionDiagnostic.code = NPM_DEPENDENCY_ISSUE;
    issueDiagnostics.push(versionDiagnostic);
  }

  return issueDiagnostics;
}

export function subscribeToDocumentChanges(
  context: ExtensionContext,
  dependencyIssueDiagnostics: DiagnosticCollection
): void {
  if (window.activeTextEditor) {
    void refreshDiagnostics(
      window.activeTextEditor.document,
      dependencyIssueDiagnostics
    );
  }

  context.subscriptions.push(
    window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        void refreshDiagnostics(editor.document, dependencyIssueDiagnostics);
      }
    })
  );

  context.subscriptions.push(
    workspace.onDidChangeTextDocument(
      (e) => void refreshDiagnostics(e.document, dependencyIssueDiagnostics)
    )
  );

  context.subscriptions.push(
    workspace.onDidCloseTextDocument((doc) =>
      dependencyIssueDiagnostics.delete(doc.uri)
    )
  );
}
