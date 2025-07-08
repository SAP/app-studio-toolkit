import { runReports } from "./run-reports";
import { logToContainer } from "../helper-logic/log-to-container";
import { getLogger } from "../logger/logger";

export { manualReport };

async function manualReport(homeFolder: string): Promise<void> {
  const diskUsageReport = await runReports(homeFolder);
  logToContainer(diskUsageReport);
  getLogger().info(
    `Automated disk usage report created: ${JSON.stringify(
      diskUsageReport,
      null,
      2
    )}`
  );
}
