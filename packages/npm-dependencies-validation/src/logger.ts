import { OutputChannel } from "./types";

export function print(data: string, outputChannel: OutputChannel): void {
  outputChannel.appendLine(data);
}
