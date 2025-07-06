import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execCb);
import { exists } from "fs-extra";
import { getLogger } from "../logger/logger";

export { allNodeModules };

async function allNodeModules(targetFolder: string): Promise<number> {
  let result = -1;

  try {
    if (await exists(targetFolder)) {
      const { stdout } = await exec(
        "find ./ -type d -name 'node_modules' |" +
          "grep -v 'node_modules/' |" + // exclude nested node_modules
          "grep -v '\\./\\.' |" + // exclude hidden folders (e.g.: node_modules_global)
          "xargs du -sm --total |" + // count size in mb
          "tail -n 1 |" + // get the total size (last line)
          "cut -f1", // get the first field (size in mb)
        {
          cwd: targetFolder,
        }
      );
      result = parseInt(stdout, 10);
    }
  } catch (error) {
    getLogger().error(
      `Error when computing all (recursive) user's 'node_modules' sizes in "${targetFolder}"`,
      error
    );
  }

  return result;
}
