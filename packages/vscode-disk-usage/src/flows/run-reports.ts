import { DiskUsageReport } from "../types";

export { runReports };

async function runReports(): Promise<DiskUsageReport> {
  const report: DiskUsageReport = {
    timestamp: -1,
    allJavaRedHat: -1,
    allNodeModules: -1,
    allNoneHidden: -1,
    KnownTechnicalFolders: {
      "~/.asdf-inst": -1,
      "~/.continue": -1,
      "~/.m2": -1,
      "~/.node_modules_global": -1,
      "~/.ui5": -1,
    },
  };

  // TODO: implement

  return new Promise(() => report);
}
