import type { DiagnosticCollection, ExtensionContext } from "vscode";
import { Range, Diagnostic, window, workspace, Uri } from "vscode";
import { findDependencyIssues } from "@sap-devx/npm-dependencies-validation";
import { set } from "lodash";
import { NPM_DEPENDENCY_ISSUES_CODE } from "./constants";

/**
 * Analyzes the package.json text document for problems.
 * @param doc package.json text document to analyze
 * @param dependencyIssueDiagnostics diagnostic collection
 */
export async function refreshDiagnostics(
  packageJsonPath: string,
  dependencyIssueDiagnostics: DiagnosticCollection
): Promise<void> {
  const npmLsResult = await findDependencyIssues(packageJsonPath);

  const diagnostics: Diagnostic[] = [];
  if (npmLsResult.problems) {
    diagnostics.push(
      constructDiagnostic(npmLsResult.problems, packageJsonPath)
    );
  }

  dependencyIssueDiagnostics.set(Uri.file(packageJsonPath), diagnostics);
}

function constructDiagnostic(
  problems: string[],
  packageJsonPath: string
): Diagnostic {
  const range = new Range(0, 0, 0, 10);
  const diagnostic = new Diagnostic(
    range,
    problems.join("\n"),
    0 // DiagnosticSeverity.Error
  );
  diagnostic.code = NPM_DEPENDENCY_ISSUES_CODE;
  set(diagnostic, "packageJsonPath", packageJsonPath); // TODO: how to pass needed data to diagnostic ?

  return diagnostic;
}
