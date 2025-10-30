import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
const exec = promisify(execCb);
import { exists } from "fs-extra";
import { getLogger } from "../logger/logger";
import { KnownHomeFoldersReport } from "../types";

export { knownTechnicalFoldersReport };

async function knownTechnicalFoldersReport(
  prefixPath: string
): Promise<KnownHomeFoldersReport> {
  getLogger().info("Running `knownTechnicalFoldersReport...");

  const report: KnownHomeFoldersReport = {
    dot: -1,
    projects: -1,
    dot_ui5: -1,
    // this `/` is safe because this code is only meant to run on linux
    "dot_ui5/framework": -1,
    dot_continue: -1,
    dot_m2: -1,
    dot_npm: -1,
    dot_node_modules_global: -1,
    dot_asdf: -1,
    "dot_asdf-inst": -1,
    dot_nvm: -1,
    "dot_vscode-server": -1,
    dot_vscode: -1,
    dot_fioritools: -1,
    dot_yarn: -1,
    dot_hanatools: -1,
    dot_cache: -1,
    dot_mscan: -1,
    dot_hdb: -1,
    dot_local: -1,
    dot_notary: -1,
  };

  for (const [reportFolderKey] of Object.entries(report)) {
    const reportFolderName = reportFolderKey.replace(/^dot(_)?/, ".");
    const fullFolderPath = resolve(prefixPath, reportFolderName);
    try {
      if (await exists(fullFolderPath)) {
        // `-s` for single line summary, `-m` for megabytes
        // `cut -f1` for returning the first field only (size in MB)
        const { stdout } = await exec(`du -sm ${fullFolderPath} | cut -f1`);
        const sizeInMb = parseInt(stdout, 10);
        report[reportFolderKey as keyof KnownHomeFoldersReport] = sizeInMb;
      } else {
        // some of these folders are optional and do not always exist.
        // so `info` is used instead of `error`
        getLogger().info(
          `Target folder "${fullFolderPath}" does not exist, unable to compute size for "${reportFolderKey}".`
        );
      }
    } catch (error) {
      getLogger().error(
        `Error when computing folder size "${fullFolderPath}"`,
        error
      );
    }
  }

  return report;
}
