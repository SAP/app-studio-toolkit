import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
const exec = promisify(execCb);
import { exists } from "fs-extra";
import { getLogger } from "../logger/logger";

export { allNoneHiddenReport };

async function allNoneHiddenReport(targetFolder: string): Promise<number> {
  getLogger().info("Running `allNoneHiddenReport`...");
  let result = -1;

  // will ensure no trailing slash
  const targetFolderResolved = resolve(targetFolder);
  try {
    if (await exists(targetFolder)) {
      // `-s` for single line summary, `-m` for megabytes
      // `cut -f1` for returning the first field only (size in MB)
      // using `/` is safe as this *.vsix is only intended for linux systems
      const { stdout } = await exec(
        `du -sm ${targetFolder} --exclude='${targetFolder}/.*' | cut -f1`
      );
      result = parseInt(stdout, 10);
    } else {
      getLogger().error(
        `Target folder "${targetFolderResolved}" does not exist, unable to compute all none hidden size.`
      );
    }
  } catch (error) {
    getLogger().error(
      `Error when computing all none hidden sub-folder sizes in "${targetFolderResolved}"`,
      error
    );
  }

  return result;
}
