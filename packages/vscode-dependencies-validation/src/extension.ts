import {
  ExtensionContext,
  workspace,
  window,
  languages,
  commands,
  CodeActionKind,
  Uri,
} from "vscode";
import { registerCodeActionsProvider } from "./npmIssuesActionProvider";
import { activateDepsIssuesAutoFix } from "./autofix/depsIssues";
import { VscodeConfig, VscodeUriFile } from "./vscodeTypes";
import { subscribeToPackageJsonChanges } from "./editorChanges";
import { createDiagnosticCollection } from "./diagnosticCollection";
import { registerCommands } from "./commands";

export function activate(context: ExtensionContext): void {
  const vscodeConfig = createVscodeConfig(context);

  registerCodeActionsProvider(vscodeConfig);

  const diagnosticCollection = createDiagnosticCollection(vscodeConfig);

  subscribeToPackageJsonChanges(vscodeConfig, diagnosticCollection);

  registerCommands(vscodeConfig, diagnosticCollection);

  activateDepsIssuesAutoFix(vscodeConfig, diagnosticCollection);
}

function createVscodeConfig(context: ExtensionContext): VscodeConfig {
  const {
    extension: { id: extId },
    subscriptions,
  } = context;

  const outputChannel = window.createOutputChannel(extId);
  // eslint-disable-next-line @typescript-eslint/unbound-method -- referencing static Uri method
  const createUri: VscodeUriFile = Uri.file;

  const kind = CodeActionKind.QuickFix;

  return {
    window,
    workspace,
    commands,
    languages,
    outputChannel,
    createUri,
    subscriptions,
    kind,
    extId,
  };
}
