import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { NpmCommandConfig, OutputChannel, SemVerRange } from "../types";
import { print } from "../logger";
import { EOL } from "os";
import { dirname } from "path";
import { noop } from "lodash";

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

function runNpmCommand(args: string[], cwd: string): Promise<string> {
  let output = "";
  const outputChannel: Partial<OutputChannel> = {
    appendLine: (data: string) => (output += data),
    show: noop,
  };
  return invokeNPMCommand(
    { commandArgs: args, cwd },
    outputChannel as OutputChannel
  )
    .catch(() => output)
    .then(() => output);
}

// this is in memory cache for repo's disttags metadata that used to resolve the expected version range
const distTagsMap = new Map<string, Map<string, string>>();

export async function retrieveDistTags(opts: {
  depPkgJsonPath: string;
  depName: string;
  expectedVerRange: SemVerRange;
}): Promise<string | SemVerRange> {
  const { depName, expectedVerRange } = opts;
  if (!distTagsMap.has(depName)) {
    const output = await runNpmCommand(
      ["dist-tags", "ls", depName],
      dirname(opts.depPkgJsonPath)
    );
    const distTags = new Map<string, string>();
    distTagsMap.set(depName, distTags);
    output
      .split(EOL)
      .map((line) => line.trim())
      .filter((line) => {
        return line.includes(":") && !/npm\s+[warn|err]/i.test(line);
      })
      .forEach((line) => {
        const [tag, version] = line.split(":");
        distTags.set(tag, version.trim());
      });
  }
  return distTagsMap.get(depName)!.get(expectedVerRange) ?? expectedVerRange;
}

// TODO: consider to uncomment it to clear distTagsMap if it gets too big
// // using a large interval to reduce memory usage
// /* istanbul ignore next -- TCO of testing this setInterval is too high*/
// setInterval(() => {
//   distTagsMap.clear();
//   // without .unref(), the interval would keep the Node.js process alive indefinitely.
//   // By calling .unref(), you allow the process to exit naturally if no other events are pending,
//   // even if the interval is still set to run periodically.
// }, 15 * 60 * 1000).unref();
