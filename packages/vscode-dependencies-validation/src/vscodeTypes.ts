import type {
  ExtensionContext,
  OutputChannel,
  Uri,
  window,
  workspace,
  languages,
  commands,
  CodeActionKind,
} from "vscode";

export type VscodeOutputChannel = Pick<
  OutputChannel,
  "append" | "show" | "appendLine"
>;

export type VscodeWorkspace = typeof workspace;

export type VscodeWindow = typeof window;

export type VscodeCommands = typeof commands;

export type VscodeContextSubscriptions = ExtensionContext["subscriptions"];

export type VscodeUriFile = typeof Uri.file;

export type VscodeLanguages = typeof languages;

export type VscodeConfig = {
  workspace: VscodeWorkspace;
  window: VscodeWindow;
  commands: VscodeCommands;
  languages: VscodeLanguages;
  subscriptions: VscodeContextSubscriptions;
  createUri: VscodeUriFile;
  outputChannel: VscodeOutputChannel;
  kind: CodeActionKind;
  extId: string;
};
