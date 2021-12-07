import type { DiagnosticCollection } from "vscode";
import { Range, Diagnostic, Uri } from "vscode";
import { findDependencyIssues } from "@sap-devx/npm-dependencies-validation";
import { set, isEmpty } from "lodash";
import { NPM_DEPENDENCY_ISSUES_CODE } from "./constants";
import { isNotInNodeModules } from "./util";

/**
 * Analyzes package.json file for problems.
 * @param packageJsonPath package.json file path to analyze
 * @param dependencyIssueDiagnostics diagnostic collection
 */
export async function refreshDiagnostics(
  packageJsonPath: string,
  dependencyIssueDiagnostics: DiagnosticCollection
): Promise<void> {
  if (isNotInNodeModules(packageJsonPath)) {
    const { problems } = await findDependencyIssues(packageJsonPath);

    const diagnostics = isEmpty(problems)
      ? []
      : [constructDiagnostic(problems, packageJsonPath)];

    dependencyIssueDiagnostics.set(Uri.file(packageJsonPath), diagnostics);
  }
}

// constructs diagnostic to be displayed in the first line of the package.json
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
