import type { Memento } from "vscode";
import { getLogger } from "../logger/logger";
import { DISK_USAGE_TIMESTAMP } from "./constants";

const internal = {
  randomPreviousReportTime,
};

export { hasPreviousReportExpired, internal };

async function hasPreviousReportExpired(opts: {
  globalState: Memento;
  daysBetweenRuns: number;
}): Promise<boolean> {
  const nowInMs = Date.now();

  const lateReportTime = opts.globalState.get(DISK_USAGE_TIMESTAMP);
  if (lateReportTime === undefined || !Number.isInteger(lateReportTime)) {
    getLogger().info(
      "No previous report time found, creating a 'made up' previous report time."
    );
    // using a random previous report time enables statistic **rate limiting**
    // to avoid every new dev-space from quickly creating a new report.
    const madeUpPreviousReportTime = randomPreviousReportTime({
      nowInMs,
      daysBetweenRuns: opts.daysBetweenRuns,
    });
    await opts.globalState.update(
      DISK_USAGE_TIMESTAMP,
      madeUpPreviousReportTime
    );
  } else {
    getLogger().info(`last report time: ${lateReportTime}`);
  }

  const lastReportMsTime = opts.globalState.get(DISK_USAGE_TIMESTAMP) as number;
  const timeBetweenRuns = opts.daysBetweenRuns * 24 * 60 * 60 * 1000;
  const previousReportExpired = nowInMs - lastReportMsTime >= timeBetweenRuns;
  return previousReportExpired;
}

/**
 * create a **random** made-up timestamp as if a previous report
 * happened sometime in between `now()` and `now() - daysBetweenRuns`
 */
function randomPreviousReportTime(opts: {
  nowInMs: number;
  daysBetweenRuns: number;
}): number {
  const periodInMs = opts.daysBetweenRuns * 24 * 60 * 60 * 1000; // Convert days to milliseconds
  const randomOffset = Math.floor(Math.random() * periodInMs);
  const madeUpPreviousReportTime = opts.nowInMs - randomOffset;
  return madeUpPreviousReportTime;
}
