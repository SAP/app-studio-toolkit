import type { Uri } from "vscode";
import { resolve } from "node:path";
import { pathExists, readJson, writeJson, remove } from "fs-extra";

const internal = {
  updateDiskUsageReportTimestamp,
};

export { isTimeToCreateNewReport, internal };

// TODO: modify to accept number args
async function isTimeToCreateNewReport(opts: {
  globalStorageUri: Uri;
  daysBetweenRuns: number;
}): Promise<boolean> {
  const extGlobalStoragePath = opts.globalStorageUri.fsPath;
  const diskUsageTimeStampPath = resolve(
    extGlobalStoragePath,
    "disk-usage-report-timestamp.json"
  );

  const nowInMs = Date.now();
  if (!(await pathExists(diskUsageTimeStampPath))) {
    await createInitialDiskUsageReportTimestamp({
      nowInMs,
      diskUsageTimeStampPath,
      daysBetweenRuns: opts.daysBetweenRuns,
    });
  }

  try {
    const lastReportMsTime = (
      (await readJson(diskUsageTimeStampPath)) as unknown as any
    ).lastReportMsTime;
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000; // One week in milliseconds
    const atLeastOneWeekPassed = nowInMs - lastReportMsTime >= oneWeekMs;
    return atLeastOneWeekPassed;
  } catch (error) {
    // possible issue with reading the timestamp file
    try {
      await remove(diskUsageTimeStampPath);
    } catch (removeError) {
      // TODO: logging
    }
  }

  await updateDiskUsageReportTimestamp(diskUsageTimeStampPath, nowInMs);
  return true;
}

async function updateDiskUsageReportTimestamp(
  diskUsageTimeStampPath: string,
  lastReportMsTime: number
): Promise<void> {
  // TODO: verify this overwrites the file
  await writeJson(diskUsageTimeStampPath, { lastReportMsTime });
}

/**
 * first execution, no timestamp file exists
 * create a **random** made-up timestamp as if a previous report
 * happened sometime in between `now()` and `now() - daysBetweenRuns`
 */
async function createInitialDiskUsageReportTimestamp(opts: {
  nowInMs: number;
  diskUsageTimeStampPath: string;
  daysBetweenRuns: number;
}): Promise<void> {
  try {
    const periodInMs = opts.daysBetweenRuns * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    const randomOffset = Math.floor(Math.random() * periodInMs);
    const madeUpPreviousReportTime = opts.nowInMs - randomOffset;
    await updateDiskUsageReportTimestamp(
      opts.diskUsageTimeStampPath,
      madeUpPreviousReportTime
    );
  } catch (err) {
    //   TODO: logging
  }
}
