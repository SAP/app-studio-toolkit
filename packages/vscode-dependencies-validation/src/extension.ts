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
import { initLogger, getLogger } from "./logger/logger";
import { registerCodeActionsProvider } from "./npmIssuesActionProvider";
import { activateDepsIssuesAutoFix } from "./autofix/activate";
import { VscodeConfig } from "./vscodeTypes";
import { subscribeToPackageJsonChanges } from "./editorChanges";
import { registerCommands } from "./commands";

export function activate(context: ExtensionContext): void {
  initLogger(context);

  const vscodeConfig = createVscodeConfig(context);

  registerCodeActionsProvider(vscodeConfig);

  subscribeToPackageJsonChanges(vscodeConfig);

  registerCommands(vscodeConfig);

  activateDepsIssuesAutoFix(vscodeConfig);

  const logger = getLogger().getChildLogger({ label: "activate" });
  logger.info("The Vscode Dependencies Validation Extension is active.");
}

// shared config
function createVscodeConfig(context: ExtensionContext): VscodeConfig {
  const {
    extension: { id: extId },
    subscriptions,
  } = context;

  const outputChannel = window.createOutputChannel(extId);
  const kind = CodeActionKind.QuickFix;
  const diagnosticCollection = createDiagnosticCollection(context);

  return {
    window,
    workspace,
    commands,
    languages,
    outputChannel,
    subscriptions,
    kind,
    diagnosticCollection,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- referencing static Uri method
    createUri: Uri.file,
  };
}

function createDiagnosticCollection(
  context: ExtensionContext
): DiagnosticCollection {
  const diagnosticCollection = languages.createDiagnosticCollection(
    context.extension.id
  );
  context.subscriptions.push(diagnosticCollection);
  return diagnosticCollection;
}
