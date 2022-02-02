import type { DepIssue } from "@sap-devx/npm-dependencies-validation";

/**
 * Temp "glue" until we display errors on exact position
 * instead of a single error at the top of the package.json file.
 */
export function depIssueToDiagnosticMsg(issue: DepIssue): string {
  switch (issue.type) {
    case "missing":
      return `The "${issue.name}" package is not installed`;
    case "mismatch":
      return (
        `The "${issue.name}" package installed version ` +
        `"${issue.actual}", does not match the declared range "${issue.expected}"`
      );
    // TODO: do we need a default handler?
  }
}
