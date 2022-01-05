import { OutputChannel } from "./types";

export function print(data: string, outputChannel?: OutputChannel): void {
  if (outputChannel) {
    outputChannel.appendLine(data);
  } else {
    console.log(data);
  }
}
