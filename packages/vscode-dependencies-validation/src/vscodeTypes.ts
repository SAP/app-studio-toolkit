import type {
  ExtensionContext,
  OutputChannel,
  Uri,
  window,
  workspace,
  languages,
  commands,
  CodeActionKind,
  DiagnosticCollection,
} from "vscode";

export type VscodeOutputChannel = Pick<
  OutputChannel,
  "append" | "show" | "appendLine"
>;

export type VscodeWorkspace = typeof workspace;

export type VscodeWindow = typeof window;

export type VscodeCommands = typeof commands;

export type VscodeContextSubscriptions = ExtensionContext["subscriptions"];

export type VscodeUriFile = {
  createUri: typeof Uri.file;
};

export type VscodeLanguages = typeof languages;

export type VscodeConfig = VscodeCodeActionProviderConfig &
  VscodePackageJsonChangesConfig &
  VscodeCommandsConfig &
  VscodeFileEventConfig &
  VscodeUriFile;

export type VscodeCodeActionProviderConfig = {
  subscriptions: VscodeContextSubscriptions;
  kind: CodeActionKind;
  languages: VscodeLanguages;
};

export type VscodePackageJsonChangesConfig = {
  window: VscodeWindow;
  subscriptions: VscodeContextSubscriptions;
  workspace: VscodeWorkspace;
  diagnosticCollection: DiagnosticCollection;
};

export type VscodeFileEventConfig = {
  workspace: VscodeWorkspace;
  diagnosticCollection: DiagnosticCollection;
  outputChannel: VscodeOutputChannel;
};

export type VscodeCommandsConfig = {
  commands: VscodeCommands;
  subscriptions: VscodeContextSubscriptions;
  outputChannel: VscodeOutputChannel;
  diagnosticCollection: DiagnosticCollection;
};
