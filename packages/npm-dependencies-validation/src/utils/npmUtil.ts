import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { get } from "lodash";
import { NpmCommandConfig, OutputChannel } from "../types";

export function getNPM(): string {
  return /^win/.test(process.platform) ? "npm.cmd" : "npm";
}

export function invokeNPMCommandWithJsonResult<T>(
  config: NpmCommandConfig,
  outputChannel?: OutputChannel
): Promise<T> {
  return new Promise((resolve, reject) => {
    let jsonParseResult: T;
    const command = executeSpawn(config, ["--json"]);

    command.stdout.on("data", (data: string) => {
      sendDataToOutputChannel(`${data}`, outputChannel);
      jsonParseResult = JSON.parse(data);
    });

    command.stderr.on("data", (data) => {
      sendDataToOutputChannel(`${data}`, outputChannel);
    });

    command.on("error", (error) => onError(error, reject, outputChannel));

    command.on("exit", () => {
      const resultJsonObj: T = get(jsonParseResult, "invalid")
        ? ({} as T)
        : jsonParseResult;
      resolve(resultJsonObj);
    });
  });
}

export function invokeNPMCommand(
  config: NpmCommandConfig,
  outputChannel: OutputChannel
): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = executeSpawn(config, []);

    command.stdout.on("data", (data) => {
      sendDataToOutputChannel(`${data}`, outputChannel);
    });

    command.stderr.on("data", (data) => {
      sendDataToOutputChannel(`${data}`, outputChannel);
    });

    command.on("error", (error) => onError(error, reject, outputChannel));

    command.on("exit", (exitCode) => {
      // in case of an error exit code is not 0
      exitCode === 0 ? resolve() : reject();
    });
  });
}

function onError(error: Error, reject: any, outputChannel?: OutputChannel) {
  const { stack } = error;
  sendDataToOutputChannel(`${stack}`, outputChannel);
  reject(error);
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
