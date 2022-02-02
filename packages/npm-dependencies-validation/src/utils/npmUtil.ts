import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { NpmCommandConfig, OutputChannel } from "../types";
import { print } from "../logger";

export function getNPM(): string {
  return /^win/.test(process.platform) ? "npm.cmd" : "npm";
}

export function invokeNPMCommand(
  config: NpmCommandConfig,
  outputChannel: OutputChannel
): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = executeSpawn(config, []);

    command.stdout.on("data", (data) => {
      print(`${data}`, outputChannel);
    });

    command.stderr.on("data", (data) => {
      print(`${data}`, outputChannel);
    });

    command.on("error", (error) => onError(error, reject, outputChannel));

    command.on("exit", (exitCode) => {
      // in case of an error exit code is not 0
      exitCode === 0 ? resolve() : reject();
    });
  });
}

function onError(error: Error, reject: any, outputChannel: OutputChannel) {
  const { stack } = error;
  print(`${stack}`, outputChannel);
  reject(error);
}

function executeSpawn(
  config: NpmCommandConfig,
  additionalArgs: string[]
): ChildProcessWithoutNullStreams {
  const { commandArgs, cwd } = config;
  return spawn(getNPM(), [...commandArgs, ...additionalArgs], { cwd });
}
