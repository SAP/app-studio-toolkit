import type { DiagnosticCollection } from "vscode";
import { VscodeConfig } from "./vscodeTypes";

export function createDiagnosticCollection(
  vscodeConfig: VscodeConfig
): DiagnosticCollection {
  const { languages, subscriptions, extId } = vscodeConfig;
  const diagnosticCollection = languages.createDiagnosticCollection(extId);

  subscriptions.push(diagnosticCollection);

  return diagnosticCollection;
}
