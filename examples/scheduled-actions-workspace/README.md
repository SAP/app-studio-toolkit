# Scheduled Actions Example

Executes scheduled actions defined in the projects .vscode/settings.json files and in the workspace scheduled.code-workspace file.

## Performing Actions

1. Open workspace using the scheduled.code-workspace file.
2. All actions are removed from the settings/workspace files after execution.

## Limitations

Actions of type `EXECUTE` cannot be used as scheduled actions.
