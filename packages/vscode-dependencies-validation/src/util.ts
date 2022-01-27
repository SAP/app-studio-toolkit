import type { DiagnosticCollection, Uri } from "vscode";
import {
  findDependencyIssues,
  fixDependencyIssues,
  DepIssue,
} from "@sap-devx/npm-dependencies-validation";
import { isEmpty, map, compact } from "lodash";
import { VscodeOutputChannel } from "./vscodeTypes";

export function isInsideNodeModules(absPath: string): boolean {
  return /[\\/]node_modules[\\/]/.test(absPath);
}

export function clearDiagnostics(
  diagnosticCollection: DiagnosticCollection,
  fileUri: Uri
): void {
  diagnosticCollection.delete(fileUri);
}

export async function findAndFixDepsIssues(
  packageJsonUri: Uri,
  outputChannel: VscodeOutputChannel
): Promise<void> {
  const { fsPath } = packageJsonUri;
  const depIssues = await findDependencyIssues(fsPath);
  const problems = depIssuesToProblemStrings(depIssues);
  if (isEmpty(problems)) return;

  await fixDependencyIssues(fsPath, outputChannel);
}

/**
 * Temp "glue" until we display errors on exact position
 * instead of a single error at the top of the package.json file.
 */
export function depIssuesToProblemStrings(issues: DepIssue[]): string[] {
  const problems = map(issues, (currIssue) => {
    switch (currIssue.type) {
      case "missing":
        return `The "${currIssue.name}" package is not installed`;
      case "mismatch":
        return (
          `The "${currIssue.name}" package installed version ` +
          `"${currIssue.actual}", does not match the declared range "${currIssue.expected}"`
        );
    }
  });

  return compact(problems);
}
