import { execSync } from "node:child_process";
import { WS_ID } from "./constants";
import { DiskUsageReport } from "../types";

export { logToContainer };

function logToContainer(report: DiskUsageReport): void {
  const logEntry = {
    application: "basdiskusage",
    wsid: WS_ID,
    ...report,
  };

  const logString = JSON.stringify(logEntry);

  // `/proc/1/fd/1` is the standard output of the main process in a container
  // This will ensure the log is captured by the container's logging system
  // TODO: why is this execSync and not plain exec?
  execSync(`echo '${logString}' > /proc/1/fd/1`, { encoding: "utf-8" });
}
