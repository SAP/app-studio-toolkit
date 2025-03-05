import { ExtensionKind, commands, env, extensions } from "vscode";
import { join, split, tail } from "lodash";
import { devspace } from "@sap/bas-sdk";
import { URL } from "node:url";

export enum ExtensionRunMode {
  desktop = `desktop`,
  basRemote = `bas-remote`,
  basWorkspace = `bas-workspace`,
  basUi = `bas-ui`,
  wsl = `wsl`,
  unexpected = `unexpected`,
}

export function shouldRunCtlServer(): boolean {
  const platform = getExtensionRunPlatform();

  // view panel visibility expects that value is available
  void commands.executeCommand("setContext", `ext.runPlatform`, platform);

  return (
    platform === ExtensionRunMode.basWorkspace || // BAS
    platform === ExtensionRunMode.basRemote || // hybrid (through ssh-remote)
    devspace.getBasMode() === "personal-edition" // personal edition
  );
}

export function getExtensionRunPlatform(
  extensionName?: string
): ExtensionRunMode {
  let runPlatform: ExtensionRunMode = ExtensionRunMode.unexpected;
  const serverUri = process.env.WS_BASE_URL;
  // see example: https://github.com/microsoft/vscode/issues/74188
  // expected values of env.remoteName: `undefined` (locally), `ssh-remote` (bas-remote) or `landscape.url` (BAS)
  if (serverUri && typeof env.remoteName === "string") {
    const remote = join(tail(split(env.remoteName, ".")), ".");
    const host = join(tail(split(new URL(serverUri).hostname, ".")), ".");
    if (host === remote) {
      // see for reference: https://code.visualstudio.com/api/references/vscode-api#Extension
      const ext = extensions.getExtension(
        extensionName ? extensionName : "SAPOSS.app-studio-toolkit"
      );
      if (ext) {
        switch (ext.extensionKind) {
          case ExtensionKind.Workspace:
            runPlatform = ExtensionRunMode.basWorkspace;
            break;
          case ExtensionKind.UI:
            runPlatform = ExtensionRunMode.basUi;
            break;
        }
      }
    } else {
      runPlatform = ExtensionRunMode.basRemote;
    }
  } else if (typeof env.remoteName === "string") {
    if (env.remoteName.toLowerCase().includes("wsl")) {
      runPlatform = ExtensionRunMode.wsl;
    }
  } else {
    runPlatform = ExtensionRunMode.desktop;
  }

  return runPlatform;
}
