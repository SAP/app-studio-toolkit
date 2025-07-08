import type { ExtConfig } from "../types";
import type { Memento } from "vscode";
import { hasPreviousReportExpired } from "../helper-logic/has-previous-report-expired";
import { runReports } from "./run-reports";
import { logToContainer } from "../helper-logic/log-to-container";
import { getLogger } from "../logger/logger";
import { performWithRandomDelay } from "../helper-logic/random-delay";
import { DISK_USAGE_TIMESTAMP } from "../helper-logic/constants";

export { automatedReport };

async function automatedReport(
  opts: ExtConfig & {
    globalState: Memento;
    homeFolder: string;
  }
): Promise<NodeJS.Timeout | undefined> {
  const shouldCreateNewReport = await hasPreviousReportExpired({
    daysBetweenRuns: opts.daysBetweenRuns,
    globalState: opts.globalState,
  });

  if (shouldCreateNewReport) {
    getLogger().info("Automated disk usage queued with random delay");
    return performWithRandomDelay({
      minMinutes: opts.initialDelay,
      maxMinutes: opts.initialDelay * 2,
      action: async () => {
        const diskUsageReport = await runReports(opts.homeFolder);
        logToContainer(diskUsageReport);
        getLogger().info(`Saving disk usage timestamp to IDE global state`);
        await opts.globalState.update(
          DISK_USAGE_TIMESTAMP,
          diskUsageReport.timestamp
        );
        getLogger().info(
          `Automated disk usage report created: ${JSON.stringify(
            diskUsageReport,
            null,
            2
          )}`
        );
      },
    });
  } else {
    getLogger().info(
      "Automated diskUsage report creation skipped, not enough time has passed since the last report."
    );
  }
}
