import { ExtensionKind, commands, env, extensions } from "vscode";
import { join, split, tail } from "lodash";
import { URL } from "node:url";

export enum ExtensionRunMode {
  desktop = `desktop`,
  basRemote = `bas-remote`,
  basWorkspace = `bas-workspace`,
  basUi = `bas-ui`,
  unexpected = `unexpected`,
}

export function isRunInBAS(): boolean {
  return getExtensionRunPlatform() === ExtensionRunMode.basWorkspace;
}

function getExtensionRunPlatform(): ExtensionRunMode {
  let runPlatform: ExtensionRunMode = ExtensionRunMode.unexpected;
  const serverUri = process.env.WS_BASE_URL;
  // see example: https://github.com/microsoft/vscode/issues/74188
  // expected values of env.remoteName: `undefined` (locally), `ssh-remote` (bas-remote) or `landscape.url` (BAS)
  if (serverUri && typeof env.remoteName === "string") {
    const remote = join(tail(split(env.remoteName, ".")), ".");
    const host = join(tail(split(new URL(serverUri).hostname, ".")), ".");
    if (host === remote) {
      // see for reference: https://code.visualstudio.com/api/references/vscode-api#Extension
      const ext = extensions.getExtension("SAPOSS.app-studio-toolkit");
      if (ext) {
        switch (ext.extensionKind) {
          case ExtensionKind.Workspace:
            runPlatform = ExtensionRunMode.basWorkspace;
            break;
          case ExtensionKind.UI:
            runPlatform = ExtensionRunMode.basUi;
            break;
        }
        runPlatform =
          ext.extensionKind === ExtensionKind.Workspace
            ? ExtensionRunMode.basWorkspace
            : ExtensionRunMode.basUi;
      }
    } else {
      runPlatform = ExtensionRunMode.basRemote;
    }
  } else {
    runPlatform = ExtensionRunMode.desktop;
  }

  // view panel visibility expects that value is available
  void commands.executeCommand("setContext", `ext.runPlatform`, runPlatform);
  return runPlatform;
}
