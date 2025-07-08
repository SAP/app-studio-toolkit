import { execSync } from "node:child_process";
import { DiskUsageReport } from "../types";
import { getLogger } from "../logger/logger";

export { logToContainer };

function logToContainer(report: DiskUsageReport): void {
  const logEntry = {
    application: "basdiskusage",
    ...report,
  };

  const logString = JSON.stringify(logEntry);

  // `/proc/1/fd/1` is the standard output of the main process in a container
  // This will ensure the log is captured by the container's logging system
  // TODO: why is this execSync and not plain exec?
  try {
    getLogger().info("logging to container main process file descriptor 1");
    execSync(`echo '${logString}' > /proc/1/fd/1`, { encoding: "utf-8" });
  } catch (error) {
    getLogger().error(
      `Failed to write disk usage logs to the container: ${error}`
    );
  }
}
