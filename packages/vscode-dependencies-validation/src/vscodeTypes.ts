import type { ExtensionContext, OutputChannel, workspace } from "vscode";

export type VscodeOutputChannel = Pick<
  OutputChannel,
  "append" | "show" | "appendLine"
>;

export type VscodeWorkspace = typeof workspace;

export type ContextSubscriptions = ExtensionContext["subscriptions"];
