import type { commands, OutputChannel } from "vscode";

export type CommandsRegisterCommand = typeof commands["registerCommand"];

export type VscodeOutputChannel = Pick<
  OutputChannel,
  "append" | "show" | "appendLine"
>;

export type ContextSubscriptions = {
  dispose(): any;
}[];
