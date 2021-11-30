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
import { findDependencyIssues } from "@sap-devx/npm-dependencies-validation";
// import { getDepIssueLocations, DependencyIssueLocation } from "./depsLocations";
import { set } from "lodash";

/** Code that is used to associate package.json diagnostic entries with code actions. */
export const NPM_DEPENDENCY_ISSUES = "npm_dependency_issues";

/**
 * Analyzes the package.json text document for problems.
 * @param doc package.json text document to analyze
 * @param dependencyIssueDiagnostics diagnostic collection
 */
export async function refreshDiagnostics(
  doc: TextDocument,
  dependencyIssueDiagnostics: DiagnosticCollection
): Promise<void> {
  const npmLsResult = await findDependencyIssues(doc.uri.fsPath);

  const diagnostics: Diagnostic[] = [];
  if (npmLsResult.problems) {
    diagnostics.push(constructDiagnostic(npmLsResult.problems, doc.uri.fsPath));
  }

  // const issueLocations: DependencyIssueLocation[] = getDepIssueLocations(
  //   doc.getText(),
  //   doc.uri.fsPath,
  //   npmDependencyIssues
  // );

  // issueLocations.forEach((issueLocation) => {
  //   const {
  //     namePoint,
  //     versionPoint,
  //     actualVersion,
  //     npmDepIssue,
  //     packageJsonPath,
  //   } = issueLocation;
  //   const nameDiagnostic = constructDiagnostic(
  //     namePoint,
  //     npmDepIssue,
  //     npmDepIssue.name,
  //     packageJsonPath
  //   );
  //   diagnostics.push(nameDiagnostic);
  //   const versionDiagnostic = constructDiagnostic(
  //     versionPoint,
  //     npmDepIssue,
  //     actualVersion,
  //     packageJsonPath
  //   );
  //   diagnostics.push(versionDiagnostic); //TODO: do we both name and version diagnostics ?
  // });

  dependencyIssueDiagnostics.set(doc.uri, diagnostics);
}

function constructDiagnostic(
  //point: Point,
  problems: string[],
  //value: string,
  packageJsonPath: string
): Diagnostic {
  //const { line, column } = point;

  const range = new Range(
    1, //line - 1,
    1, //column,
    1, //line - 1,
    5 //column + value?.length || 0
  );
  const diagnostic = new Diagnostic(
    range,
    problems?.join("\n"),
    DiagnosticSeverity.Error
  );
  diagnostic.code = NPM_DEPENDENCY_ISSUES;
  set(diagnostic, "packageJsonPath", packageJsonPath); // TODO: how to pass needed data to diagnostic ?

  return diagnostic;
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
