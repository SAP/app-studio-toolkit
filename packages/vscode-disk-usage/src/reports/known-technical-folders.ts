import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
const exec = promisify(execCb);
import { exists } from "fs-extra";
import { getLogger } from "../logger/logger";
import { KnownTechnicalFoldersReport } from "../types";

export { knownTechnicalFoldersReport };

async function knownTechnicalFoldersReport(
  prefixPath: string
): Promise<KnownTechnicalFoldersReport> {
  getLogger().info("Running `knownTechnicalFoldersReport...");

  const report: KnownTechnicalFoldersReport = {
    ".ui5": -1,
    ".continue": -1,
    ".m2": -1,
    ".node_modules_global": -1,
    ".asdf-inst": -1,
  };

  for (const [reportFolder] of Object.entries(report)) {
    const fullFolderPath = resolve(prefixPath, reportFolder);
    try {
      if (await exists(fullFolderPath)) {
        // `-s` for single line summary, `-m` for megabytes
        // `cut -f1` for returning the first field only (size in MB)
        const { stdout } = await exec(`du -sm ${fullFolderPath} | cut -f1`);
        const sizeInMb = parseInt(stdout, 10);
        report[reportFolder as keyof KnownTechnicalFoldersReport] = sizeInMb;
      } else {
        // some of these folders are optional and do not always exist.
        // so `info` is used instead of `error`
        getLogger().info(
          `Target folder "${fullFolderPath}" does not exist, unable to compute size for "${reportFolder}".`
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
