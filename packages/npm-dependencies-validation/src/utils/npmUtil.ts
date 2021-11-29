import { spawn } from "child_process";
import { VscodeOutputChannel } from "../types";

export function getNPM(): string {
  return /^win/.test(process.platform) ? "npm.cmd" : "npm";
}

export function invokeNPMCommand<T>(
  commandArgs: string[],
  cwd: string,
  outputChannel?: VscodeOutputChannel
): Promise<T> {
  return new Promise((resolve, reject) => {
    const command = spawn(getNPM(), [...commandArgs, "--json"], { cwd });

    command.stdout.on("data", (data) => {
      showData(`${data}`, outputChannel);
      const jsonObjResult: T = JSON.parse(data);
      resolve(jsonObjResult);
    });

    command.on("error", (error) => {
      showError(error, outputChannel);
      reject(error);
    });
  });
}

function showError(error: Error, outputChannel?: VscodeOutputChannel): void {
  const message = `${error.stack}`;
  console.error(message);
  outputChannel?.append(message);
}

function showData(data: string, outputChannel?: VscodeOutputChannel): void {
  const dataStr = `${data}`;
  console.log(dataStr);
  outputChannel?.append(dataStr);
}
