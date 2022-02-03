import type { DepIssue } from "@sap-devx/npm-dependencies-validation";
import { UnreachableCaseError } from "ts-essentials";

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
    default: {
      // this actually works as a design time check using the `never` type
      throw new UnreachableCaseError(issue);
    }
  }
}
