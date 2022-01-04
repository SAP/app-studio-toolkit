import { OutputChannel } from "./types";
import { isPathExist } from "./utils/fileUtil";
import { invokeNPMCommand } from "./utils/npmUtil";
import { printLine } from "./utils/outputUtil";
import { getPackageJsonPaths } from "./utils/packageJsonUtil";

export const internal = {
  fixing: (absPath: string) =>
    `\n${absPath}\n[${getDateAndTime()}] Fixing dependency issues...\n`,
  doneFixing: (absPath: string) =>
    `\n[${getDateAndTime()}] Done. \n${absPath}\n`,
};

export async function fixDependencyIssues(
  absPath: string,
  outputChannel: OutputChannel
): Promise<void> {
  const { filePath, dirPath: cwd } = getPackageJsonPaths(absPath);
  const shouldFix = await shouldFixDependencyIssues(filePath);
  if (!shouldFix) return;

  printLine(internal.fixing(filePath), outputChannel);

  const config = { commandArgs: ["install"], cwd };
  await invokeNPMCommand(config, outputChannel);

  printLine(internal.doneFixing(filePath), outputChannel);
}

function getDateAndTime(): string {
  const today = new Date();
  const date = `${today.getFullYear()}-${
    today.getMonth() + 1
  }-${today.getDate()}`;
  const time = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
  return `${date} ${time}`;
}

async function shouldFixDependencyIssues(
  packageJsonPath: string
): Promise<boolean> {
  const packageJsonExists = await isPathExist(packageJsonPath);
  if (!packageJsonExists) return false;

  return true;
}