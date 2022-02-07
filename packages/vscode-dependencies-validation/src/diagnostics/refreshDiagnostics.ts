import type { DiagnosticCollection, Uri } from "vscode";
import { readFile } from "fs-extra";
import { IChildLogger } from "@vscode-logging/types";
import { findDependencyIssues } from "@sap-devx/npm-dependencies-validation";
import { convertToDiagnostics } from "./convertToDiagnostics";
import { getLogger } from "../logger/logger";

function logger(): IChildLogger {
  return getLogger().getChildLogger({ label: "diagnostics" });
}

/**
 * Analyzes package.json file for problems and updates the diagnostics collection
 *
 * @param uri package.json file path to analyze
 * @param dependencyIssueDiagnostics vscode diagnostic collection
 */
export async function refreshDiagnostics(
  uri: Uri,
  dependencyIssueDiagnostics: Pick<DiagnosticCollection, "set">
): Promise<void> {
  const pkgJsonPath = uri.fsPath;
  const issues = await findDependencyIssues(pkgJsonPath);
  logger().trace("Dependency Issues Detected", { issues });

  // In theory, we should use VSCode's file system APIs
  // However, these npm related flows do not (currently?) support virtual file systems or "edited in memory" files:
  // 1. spawning processes in `@sap-devx/npm-dependencies-validation`, e.g: `npm install` to fix the dep issues.
  // 2. reading from fs directly in `@sap-devx/npm-dependencies-validation`
  const diagnostics = await convertToDiagnostics({
    pkgJsonPath,
    issues,
    readFile,
  });
  logger().trace("VSCode Diagnostics created", { diagnostics });
  dependencyIssueDiagnostics.set(uri, diagnostics);
}
