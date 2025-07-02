import type { Memento } from "vscode";

const internal = {
  randomPreviousReportTime,
};

export { isTimeToCreateNewReport, internal };

const DISK_USAGE_TIMESTAMP = "bas-disk-usage-report-timestamp";
async function isTimeToCreateNewReport(opts: {
  globalState: Memento;
  daysBetweenRuns: number;
}): Promise<boolean> {
  const nowInMs = Date.now();

  const lateReportTime = opts.globalState.get(DISK_USAGE_TIMESTAMP);
  if (lateReportTime === undefined || !Number.isInteger(lateReportTime)) {
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
  }

  const lastReportMsTime = opts.globalState.get(DISK_USAGE_TIMESTAMP) as number;
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const atLeastOneWeekPassed = nowInMs - lastReportMsTime >= oneWeekMs;
  return atLeastOneWeekPassed;
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
