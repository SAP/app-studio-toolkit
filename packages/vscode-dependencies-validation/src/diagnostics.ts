import type { DiagnosticCollection, Uri } from "vscode";
import { Range, Diagnostic } from "vscode";
import { basename } from "path";
import { findDependencyIssues } from "@sap-devx/npm-dependencies-validation";
import { isEmpty } from "lodash";
import { NPM_DEPENDENCY_ISSUES_CODE } from "./constants";
import { isInsideNodeModules } from "./util";

/**
 * Analyzes package.json file for problems.
 * @param packageJsonPath package.json file path to analyze
 * @param dependencyIssueDiagnostics diagnostic collection
 */
export async function refreshDiagnostics(
  uri: Uri,
  dependencyIssueDiagnostics: DiagnosticCollection
): Promise<void> {
  const { fsPath } = uri;

  if (isInsideNodeModules(fsPath)) return;
  if (basename(fsPath) !== "package.json") return;

  const { problems } = await findDependencyIssues(fsPath);

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
