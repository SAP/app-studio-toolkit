import { spawn } from "child_process";

const NPM = /^win/.test(process.platform) ? "npm.cmd" : "npm";

export function spawnCommand(
  commandArgs: string[],
  workingDir: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const command = spawn(NPM, commandArgs, { cwd: workingDir });

    command.stdout.on("data", (data) => {
      const jsonObjResult = JSON.parse(data ?? "{}");
      resolve(jsonObjResult);
    });

    command.on("error", (error) => {
      console.error(error);
      reject(error);
    });
  });
}
