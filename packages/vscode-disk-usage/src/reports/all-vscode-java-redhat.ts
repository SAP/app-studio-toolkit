import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execCb);
import { resolve } from "node:path";
import { exists } from "fs-extra";
import { getLogger } from "../logger/logger";

export { allVscodeJavaRedHatReport };

async function allVscodeJavaRedHatReport(
  targetFolder: string
): Promise<number> {
  getLogger().info("Running `allVscodeJavaRedHatReport()`...");

  let result = -1;

  const workspaceStorageFolder = resolve(
    targetFolder,
    ".vscode",
    "data",
    "User",
    "workspaceStorage"
  );

  try {
    if (await exists(workspaceStorageFolder)) {
      const { stdout } = await exec(
        "find ./ -type d -name 'redhat.java' |" + // find all 'redhat.java' folders
          "xargs du -sm --total |" + // count size in mb
          "tail -n 1 |" + // get the total size (last line)
          "cut -f1", // get the first field (size in mb)
        {
          cwd: workspaceStorageFolder,
        }
      );
      result = parseInt(stdout, 10);
    } else {
      getLogger().error(
        `Workspace storage folder "${workspaceStorageFolder}" does not exist, unable to compute 'redhat.java' size.`
      );
    }
  } catch (error) {
    getLogger().error(
      `Error when computing all (recursive) user's 'java.redhat' sizes in "${targetFolder}"`,
      error
    );
  }

  return result;
}
