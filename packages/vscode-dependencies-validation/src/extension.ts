import {
  ExtensionContext,
  workspace,
  window,
  languages,
  commands,
  CodeActionKind,
  Uri,
  DiagnosticCollection,
} from "vscode";
import { registerCodeActionsProvider } from "./npmIssuesActionProvider";
import { activateDepsIssuesAutoFix } from "./autofix/depsIssues";
import { VscodeConfig, VscodeUriFile } from "./vscodeTypes";
import { subscribeToPackageJsonChanges } from "./editorChanges";
import { registerCommands } from "./commands";

export function activate(context: ExtensionContext): void {
  const vscodeConfig = createVscodeConfig(context);

  const diagnosticCollection = createDiagnosticCollection(context);

  registerCodeActionsProvider(vscodeConfig);

  subscribeToPackageJsonChanges(vscodeConfig);

  registerCommands(vscodeConfig);

  activateDepsIssuesAutoFix(vscodeConfig);
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

  const diagnosticCollection = createDiagnosticCollection(context);

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
    diagnosticCollection
  };
}

function createDiagnosticCollection(
  context: ExtensionContext
): DiagnosticCollection {
  const diagnosticCollection = languages.createDiagnosticCollection(context.extension.id);
  context.subscriptions.push(diagnosticCollection);
  return diagnosticCollection;
}