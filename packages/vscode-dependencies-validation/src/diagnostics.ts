import { Point } from "unist";
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
import {
  findDependencyIssues,
  NPMDependencyIssue,
} from "@sap-devx/npm-dependencies-validation";
import { getDepIssueLocations, DependencyIssueLocation } from "./depsLocations";
import { set, startCase } from "lodash";

/** Code that is used to associate package.json diagnostic entries with code actions. */
export const NPM_DEPENDENCY_ISSUE = "npm_dependency_issue";

/**
 * Analyzes the package.json text document for problems.
 * @param doc package.json text document to analyze
 * @param dependencyIssueDiagnostics diagnostic collection
 */
export async function refreshDiagnostics(
  doc: TextDocument,
  dependencyIssueDiagnostics: DiagnosticCollection
): Promise<void> {
  const npmDependencyIssues = await findDependencyIssues(doc.uri.fsPath);

  const diagnostics: Diagnostic[] = [];

  const issueLocations: DependencyIssueLocation[] = getDepIssueLocations(
    doc.getText(),
    doc.uri.fsPath,
    npmDependencyIssues
  );

  issueLocations.forEach((issueLocation) => {
    const {
      namePoint,
      versionPoint,
      actualVersion,
      npmDepIssue,
      packageJsonPath,
    } = issueLocation;
    const nameDiagnostic = constructDiagnostic(
      namePoint,
      npmDepIssue,
      npmDepIssue.name,
      packageJsonPath
    );
    diagnostics.push(nameDiagnostic);
    const versionDiagnostic = constructDiagnostic(
      versionPoint,
      npmDepIssue,
      actualVersion,
      packageJsonPath
    );
    diagnostics.push(versionDiagnostic);
  });

  dependencyIssueDiagnostics.set(doc.uri, diagnostics);
}

function constructDiagnostic(
  point: Point,
  depIssue: NPMDependencyIssue,
  value: string,
  packageJsonPath: string
): Diagnostic {
  const { line, column } = point;

  const range = new Range(line - 1, column, line - 1, column + value.length);
  const message = createMessage(depIssue);
  const diagnostic = new Diagnostic(range, message, DiagnosticSeverity.Error);
  diagnostic.code = NPM_DEPENDENCY_ISSUE;
  set(diagnostic, "depIssue", depIssue);
  set(diagnostic, "packageJsonPath", packageJsonPath);

  return diagnostic;
}

function createMessage(npmDepIssue: NPMDependencyIssue): string {
  const { type, name, version } = npmDepIssue;
  return `${startCase(type)} dependency ${name}@${version} is found.`;
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
