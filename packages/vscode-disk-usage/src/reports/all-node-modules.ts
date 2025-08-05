import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execCb);
import { exists } from "fs-extra";
import { getLogger } from "../logger/logger";

export { allNodeModulesReport };

async function allNodeModulesReport(homeFolder: string): Promise<number> {
  getLogger().info("Running `allNodeModulesReport`...");
  let result = -1;

  try {
    if (await exists(homeFolder)) {
      const findRelevantNodeModules =
        "find ./ -type d -name 'node_modules' |" +
        "grep -v 'node_modules/' |" + // exclude nested node_modules
        "grep -v '\\./\\.' |"; // exclude hidden folders (e.g.: node_modules_global)

      const { stdout: countStdout } = await exec(
        findRelevantNodeModules + "wc -l",
        {
          cwd: homeFolder,
        }
      );
      const nodeModulesFound = parseInt(countStdout, 10) > 0;
      if (nodeModulesFound) {
        const { stdout } = await exec(
          findRelevantNodeModules +
            "xargs du -sm --total |" + // count size in mb
            "tail -n 1 |" + // get the total size (last line)
            "cut -f1", // get the first field (size in mb)
          {
            cwd: homeFolder,
          }
        );
        // TODO: in some unknown edge case, stdout may not be an int
        // and will compute to `NaN`, how to reproduce this?
        result = parseInt(stdout, 10);
      } else {
        getLogger().info(
          `No 'node_modules' found in "${homeFolder}", skipping size computation.`
        );
        result = 0;
      }
    } else {
      getLogger().error(
        `Target folder "${homeFolder}" does not exist, unable to compute 'node_modules' size.`
      );
    }
  } catch (error) {
    getLogger().error(
      `Error when computing all (recursive) user's 'node_modules' sizes in "${homeFolder}"`,
      error
    );
  }

  return result;
}
