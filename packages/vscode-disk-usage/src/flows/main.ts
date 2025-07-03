import type { Memento } from "vscode";
import type { ExtConfig } from "../types";
import { hasPreviousReportExpired } from "../helper-logic/has-previous-report-expired";
import { runReports } from "./run-reports";
import { getLogger } from "../logger/logger";
import { logToContainer } from "../helper-logic/log-to-container";

export { main };

async function main(
  opts: ExtConfig & {
    globalState: Memento;
  }
): Promise<void> {
  if (opts.disable) {
    getLogger().info(
      "DiskUsage Report Extension is disabled via workspace configuration setting"
    );
  }

  const shouldCreateNewReport = await hasPreviousReportExpired({
    daysBetweenRuns: opts.daysBetweenRuns,
    globalState: opts.globalState,
  });

  if (shouldCreateNewReport) {
    const diskUsageReport = await runReports();
    logToContainer(diskUsageReport);
  }
}
