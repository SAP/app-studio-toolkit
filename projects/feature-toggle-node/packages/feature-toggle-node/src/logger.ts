export const SHOW_LOG_ENV = "SHOW_LOG";

export function log(logMessage: string): void {
  const showLog = process.env[SHOW_LOG_ENV];
  if (showLog) {
    logMessage = logMessage.replace(/\n|\r/g, ""); // sanitize input
    console.log(`[Feature Toggle] ${logMessage}`);
  }
}
