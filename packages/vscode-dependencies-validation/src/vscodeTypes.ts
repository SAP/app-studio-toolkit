import type { OutputChannel } from "vscode";

export type VscodeOutputChannel = Pick<
  OutputChannel,
  "append" | "show" | "appendLine"
>;
