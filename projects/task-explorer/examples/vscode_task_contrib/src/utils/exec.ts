import { execSync } from "child_process";

export function executeCommand(command: string): string {
  // attention: the synchronous version of command execution
  // is used in the sample only for demo purposes
  // for running "<command> --help" commands
  // if you need to run shell commands in your applications
  // use asynchronous version of execution
  // especially for long running commands
  try {
    return execSync(command, { encoding: "utf8" });
  } catch (e: any) {
    return e.toString();
  }
}
