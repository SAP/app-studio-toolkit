// Should be identical to the settings name contributed from vscode-bas-extension.
export const ANALYTICS_ENABLED_SETTING_NAME = "sapbas.telemetryEnabled";

export const APPINSIGHTS_CONNECTION_STRING =
  "InstrumentationKey=60284eda-c8cc-4794-bdb7-d35f0abb66f9;IngestionEndpoint=https://germanywestcentral-1.in.applicationinsights.azure.com/;LiveEndpoint=https://germanywestcentral.livediagnostics.monitor.azure.com/";

export enum ExtensionRunMode {
  desktop = `desktop`,
  basRemote = `bas-remote`,
  basWorkspace = `bas-workspace`,
  basUi = `bas-ui`,
  wsl = `wsl`,
  unexpected = `unexpected`,
}
