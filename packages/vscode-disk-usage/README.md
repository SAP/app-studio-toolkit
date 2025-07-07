# Disk Usage Extension

This extension is for use in SAP Business Application Studio only.
It produces and logs a disk usage report for various folders in the dev-space.

## Features

- Automated disk usage report generation (by default approx once a week).
- Manual Command (`disk-usage.log-disk-usage`) to generate a disk usage report.

## Settings

- `vscode-disk-usage.report.disable` : disable the automated disk usage report.
- `vscode-disk-usage.report.initialDelay` : Minimum Number of minutes after dev-space startup before running the disk usage report.
- `vscode-disk-usage.report.daysBetweenRuns` : number of days between runs of the automated disk usage report reports.

## Technical Details

- This extension requires a linux environment, with various commands available in the PATH. for example: `du` and `find` (and others...)
- The generated report is written to the dev space container for later processing.
