import {
  ExtensionContext,
  workspace,
  window,
  languages,
  commands,
  CodeActionKind,
  Uri,
  DiagnosticCollection,
  OutputChannel,
} from "vscode";
import { initLogger, getLogger } from "./logger/logger";
import { registerCodeActionsProvider } from "./npmIssuesActionProvider";
import { activateDepsIssuesAutoFix } from "./autofix/activate";
import { VscodeConfig } from "./vscodeTypes";
import { subscribeToPackageJsonChanges } from "./editorChanges";
import { registerCommands } from "./commands";

export function activate(context: ExtensionContext): void {
  const extensionName = "vscode-dependencies-validation";

  const outputChannel = window.createOutputChannel(extensionName);
  initLogger(context, outputChannel, extensionName);

  const vscodeConfig = createVscodeConfig(
    context,
    outputChannel,
    extensionName
  );

  registerCodeActionsProvider(vscodeConfig);

  subscribeToPackageJsonChanges(vscodeConfig);

  registerCommands(vscodeConfig);

  activateDepsIssuesAutoFix(vscodeConfig);

  const logger = getLogger().getChildLogger({ label: "extension" });
  logger.info("The Vscode Dependencies Validation Extension is active.");
}

// shared config
function createVscodeConfig(
  context: ExtensionContext,
  outputChannel: OutputChannel,
  extensionName: string
): VscodeConfig {
  const { subscriptions } = context;

  const kind = CodeActionKind.QuickFix;
  const diagnosticCollection = createDiagnosticCollection(
    context,
    extensionName
  );

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
  context: ExtensionContext,
  extensionName: string
): DiagnosticCollection {
  const diagnosticCollection =
    languages.createDiagnosticCollection(extensionName);
  context.subscriptions.push(diagnosticCollection);
  return diagnosticCollection;
}
