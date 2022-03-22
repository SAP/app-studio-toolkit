import { OutputChannel } from "./types";
import { doesPathExist } from "./utils/fileUtil";
import { invokeNPMCommand } from "./utils/npmUtil";
import { print } from "./logger";
import { createPackageJsonPaths } from "./utils/packageJsonUtil";

export const internal = {
  fixing: (absPath: string) =>
    `\n${absPath}\n[${getTime()}] Fixing dependency issues...\n`,
  doneFixing: (absPath: string) =>
    `\n[${getTime()}] Done fixing dependency issues. \n${absPath}\n`,
};

export async function fixDependencyIssues(
  absPath: string,
  // TODO: wrap in a more generic logger interface
  outputChannel: OutputChannel
): Promise<void> {
  const { filePath, dirPath: cwd } = createPackageJsonPaths(absPath);
  const shouldFix = await shouldFixDependencyIssues(filePath);
  if (!shouldFix) return;

  // it is important to indicate to the end user an `npm install` process is in progress
  outputChannel.show(true);
  print(internal.fixing(filePath), outputChannel);

  const config = { commandArgs: ["install"], cwd };
  await invokeNPMCommand(config, outputChannel);

  print(internal.doneFixing(filePath), outputChannel);
}

function getTime(): string {
  return new Date().toLocaleTimeString();
}

async function shouldFixDependencyIssues(
  packageJsonPath: string
): Promise<boolean> {
  const packageJsonExists = await doesPathExist(packageJsonPath);
  if (!packageJsonExists) return false;

  return true;
}
