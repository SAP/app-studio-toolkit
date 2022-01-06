import type { DiagnosticCollection, Uri } from "vscode";
import { Range, Diagnostic } from "vscode";
import { isEmpty } from "lodash";
import { findDependencyIssues } from "@sap-devx/npm-dependencies-validation";
import { getLogger } from "./logger/logger";
import { NPM_DEPENDENCY_ISSUES_CODE } from "./constants";

const logger = getLogger().getChildLogger({ label: "diagnostics" });

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
  const message = problems.join("\n");
  const diagnostic = new Diagnostic(
    range,
    message,
    0 // DiagnosticSeverity.Error
  );
  diagnostic.code = NPM_DEPENDENCY_ISSUES_CODE;

  logger.trace(`Diagnostic ${message} has been added.`);

  return diagnostic;
}

export const internal = {
  logger,
};
