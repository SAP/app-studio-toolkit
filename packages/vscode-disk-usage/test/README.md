## Automated Tests

Only simple unit tests are included here.
This is because full report tests require running in an env which includes
a specific set of linux commands.

For example, the default `du` command on macOs lacks support for the `--total` flag used by
some reports.

The overhead involved in running the tests inside a docker container
is not worth the effort, use Manual-Tests instead.

## Manual Tests

### Automated Flow

1. Build the \*.vsix (`npm run ci`).
2. Deploy the \*.vsix on BAS
3. Modify the Configuration options:
   - `vscode-disk-usage.logging.level` --> debug
   - `vscode-disk-usage.report.initialDelay` --> 1
   - `vscode-disk-usage.report.daysBetweenRuns` --> 0
4. Inspect the BAS output Channel `SAPOSS.vscode-disk-usage`
   - The report should be generated after 1-2 minutes.

### Manual Flow

1. enable `disk-usage.log-disk-usage` command in the package.json (Change to: `"when": "true"`).
2. Build the \*.vsix (`npm run ci`).
3. Deploy the \*.vsix on BAS
4. Modify the Configuration options:
   - `vscode-disk-usage.logging.level` --> debug
   - `vscode-disk-usage.report.initialDelay` --> 1
   - `vscode-disk-usage.report.daysBetweenRuns` --> 0
5. Run the `disk-usage.log-disk-usage` command from the commandPalette.
6. Inspect the BAS output Channel `SAPOSS.vscode-disk-usage`
