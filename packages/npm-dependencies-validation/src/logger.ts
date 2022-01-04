import { OutputChannel } from "./types";

export function print(data: string, outputChannel?: OutputChannel): void {
  if (outputChannel) {
    outputChannel.append(data);
  } else {
    console.log(data);
  }
}
