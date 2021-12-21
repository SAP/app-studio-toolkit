import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { NpmCommandConfig, OutputChannel } from "../types";

export function getNPM(): string {
  return /^win/.test(process.platform) ? "npm.cmd" : "npm";
}

// add --verbose
// print to output channel when verbose is set (naive implementation)
export function invokeNPMCommandWithJsonResult<T>(
  config: NpmCommandConfig,
  outputChannel?: OutputChannel
): Promise<T> {
  return new Promise((resolve, reject) => {
    const command = executeSpawn(config, ["--json"]);

    command.stdout.on("data", (data) => {
      sendDataToOutputChannel(`${data}`, outputChannel);
      const jsonObjResult: T = JSON.parse(data);
      resolve(jsonObjResult);
    });

    // TODO: why there is no error event when npm install fails ???
    // it fails when unavailable dependency/version defined in package.json
    command.on("error", (error) => {
      const { stack } = error;
      sendDataToOutputChannel(`${stack}`, outputChannel);
      reject(error);
    });
  });
}

export function invokeNPMCommand(
  config: NpmCommandConfig,
  outputChannel: OutputChannel
): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = executeSpawn(config, []);

    // TODO: add start, cwd and end
    command.stdout.on("data", (data) => {
      sendDataToOutputChannel(`${data}`, outputChannel);
    });

    command.on("exit", () => {
      resolve();
    });

    // TODO: does not stop here when an error occurs ?
    command.on("error", (error) => {
      const { stack } = error;
      sendDataToOutputChannel(`${stack}`, outputChannel);
      reject(error);
    });
  });
}

function executeSpawn(
  config: NpmCommandConfig,
  additionalArgs: string[]
): ChildProcessWithoutNullStreams {
  const { commandArgs, cwd } = config;
  return spawn(getNPM(), [...commandArgs, ...additionalArgs], { cwd });
}

function sendDataToOutputChannel(
  data: string,
  outputChannel?: OutputChannel
): void {
  outputChannel?.append(data);
}
