import { execFile } from "node:child_process";
import { join } from "node:path";

export function runCli(
  args: string[]
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [join(__dirname, "..", "..", "src", "cli.js"), ...args],
      (error, stdout, stderr) => {
        if (error !== null) {
          reject(new Error(stderr || error.message));
          return;
        }
        resolve({ stdout, stderr });
      }
    );
  });
}
