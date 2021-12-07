import { spawn } from "child_process";
import { NpmCommandConfig, OutputChannel } from "../types";

export function getNPM(): string {
  return /^win/.test(process.platform) ? "npm.cmd" : "npm";
}

export function invokeNPMCommand<T>(
  config: NpmCommandConfig,
  outputChannel?: OutputChannel
): Promise<T> {
  const { commandArgs, cwd } = config;
  return new Promise((resolve, reject) => {
    const command = spawn(getNPM(), [...commandArgs, "--json"], { cwd });

    command.stdout.on("data", (data) => {
      sendDataToOutputChannel(`${data}`, outputChannel);
      const jsonObjResult: T = JSON.parse(data);
      resolve(jsonObjResult);
    });

    command.on("error", (error) => {
      const { stack } = error;
      sendDataToOutputChannel(`${stack}`, outputChannel);
      reject(error);
    });
  });
}

function sendDataToOutputChannel(
  data: string,
  outputChannel: OutputChannel | undefined
): void {
  outputChannel?.append(data);
}
