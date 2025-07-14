import type { DiskUsageReport } from "../types";
import { getWsID } from "../helper-logic/constants";
import { knownTechnicalFoldersReport } from "../reports/known-technical-folders";
import { allVscodeJavaRedHatReport } from "../reports/all-vscode-java-redhat";
import { allNodeModulesReport } from "../reports/all-node-modules";
import { allNoneHiddenReport } from "../reports/all-none-hidden";

export { runReports };

async function runReports(homeFolder: string): Promise<DiskUsageReport> {
  const allJavaRedHat = await allVscodeJavaRedHatReport(homeFolder);
  const allNodeModules = await allNodeModulesReport(homeFolder);
  const allNoneHidden = await allNoneHiddenReport(homeFolder);
  const knownTechnicalFolders = await knownTechnicalFoldersReport(homeFolder);

  const report: DiskUsageReport = {
    timestamp: new Date().getTime(),
    workspaceId: getWsID(),
    allJavaRedHat: allJavaRedHat,
    allNodeModules: allNodeModules,
    allNoneHidden: allNoneHidden,
    knownTechnicalFolders,
  };

  return report;
}
