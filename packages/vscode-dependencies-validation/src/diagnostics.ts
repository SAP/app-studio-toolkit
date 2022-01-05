import type { DiagnosticCollection, Uri } from "vscode";
import { Range, Diagnostic } from "vscode";
import { isEmpty } from "lodash";
import { findDependencyIssues } from "@sap-devx/npm-dependencies-validation";
import { NPM_DEPENDENCY_ISSUES_CODE } from "./constants";

/**
 * Analyzes package.json file for problems.
 * @param uri package.json file path to analyze
 * @param dependencyIssueDiagnostics diagnostic collection
 */
export async function refreshDiagnostics(
  uri: Uri,
  dependencyIssueDiagnostics: DiagnosticCollection
): Promise<void> {
  const { problems } = await findDependencyIssues(uri.fsPath);
  const diagnostics = isEmpty(problems) ? [] : [constructDiagnostic(problems)];
  dependencyIssueDiagnostics.set(uri, diagnostics);
}

// constructs diagnostic to be displayed in the first line of the package.json
function constructDiagnostic(problems: string[]): Diagnostic {
  const range = new Range(0, 0, 0, 10);
  const diagnostic = new Diagnostic(
    range,
    problems.join("\n"),
    0 // DiagnosticSeverity.Error
  );
  diagnostic.code = NPM_DEPENDENCY_ISSUES_CODE;

  return diagnostic;
}
