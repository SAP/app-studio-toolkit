import { spawn } from "child_process";

export function getNPM(): string {
  return /^win/.test(process.platform) ? "npm.cmd" : "npm";
}

export function invokeNPMCommand<T>(
  commandArgs: string[],
  cwd: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const command = spawn(getNPM(), [...commandArgs, "--json"], { cwd });

    command.stdout.on("data", (data) => {
      const jsonObjResult: T = JSON.parse(data);
      resolve(jsonObjResult);
    });

    command.on("error", (error) => {
      reject(error);
    });
  });
}
