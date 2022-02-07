import type { DepIssue, DepsProp } from "@sap-devx/npm-dependencies-validation";
import type { readFile } from "fs-extra";
import { Diagnostic, Range } from "vscode";
import { TextDocument } from "vscode-languageserver-textdocument";
import { findNodeAtLocation, Node, parseTree } from "jsonc-parser";
import { compact, map } from "lodash";
import { depIssueToDiagnosticMsg } from "./messages";
import { NPM_DEPENDENCY_ISSUES_CODE } from "../constants";

export type ConvertToDiagnosticsOpts = {
  pkgJsonPath: string;
  issues: DepIssue[];
  // DI parameter for ease of testing
  readFile: typeof readFile;
};

const UNABLE_TO_LOCATE_RANGE = undefined;
export async function convertToDiagnostics(
  opts: ConvertToDiagnosticsOpts
): Promise<Diagnostic[]> {
  const emptyDiagnostics: Diagnostic[] = [];
  try {
    const pkgJsonText = await opts.readFile(opts.pkgJsonPath, "utf-8");
    const rootNode = parseTree(pkgJsonText);

    if (rootNode === undefined) {
      return emptyDiagnostics;
    }

    const diagnostics = map(opts.issues, (currIssue) => {
      const range = depNodeToDiagnosticRange({
        issue: currIssue,
        text: pkgJsonText,
        rootNode: rootNode,
      });

      // edge case (race condition) where the offending dependency is no longer part of the pkg.json file
      if (range === undefined) {
        return UNABLE_TO_LOCATE_RANGE;
      }

      const message = depIssueToDiagnosticMsg(currIssue);
      const currDiagnostic = new Diagnostic(range, message);
      // additional metadata is used to link to the relevant quickfix action.
      currDiagnostic.code = NPM_DEPENDENCY_ISSUES_CODE;
      return currDiagnostic;
    });

    return compact(diagnostics);
  } catch {
    return emptyDiagnostics;
  }
}

type IssueToDiagnosticRangeOpts = {
  rootNode: Node;
  text: string;
  issue: DepIssue;
};
function depNodeToDiagnosticRange(
  opts: IssueToDiagnosticRangeOpts
): Range | undefined {
  const depsProp: DepsProp = opts.issue.isDev
    ? "devDependencies"
    : "dependencies";

  const jsonDepPath: [DepsProp, string] = [depsProp, opts.issue.name];
  const node = findNodeAtLocation(opts.rootNode, jsonDepPath);
  if (node === undefined) {
    return UNABLE_TO_LOCATE_RANGE;
  }
  const textDoc = TextDocument.create("dummy", "json", 1, opts.text);
  const startPos = textDoc.positionAt(node.offset + 1);
  const endPos = textDoc.positionAt(node.offset + node.length - 1);
  const range: Range = new Range(
    startPos.line,
    startPos.character,
    endPos.line,
    endPos.character
  );
  return range;
}
