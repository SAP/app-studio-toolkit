import { ExtensionKind, env, extensions } from "vscode";
import { join, split, tail } from "lodash";
import { URL } from "node:url";

export function isRunInBAS(): boolean {
  const serverUri = process.env.WS_BASE_URL;
  // see example: https://github.com/microsoft/vscode/issues/74188
  // expected values of env.remoteName: `undefined` (locally), `ssh-remote` (bas-remote) or `landscape.url` (BAS)
  if (serverUri && typeof env.remoteName === "string") {
    const remote = join(tail(split(env.remoteName, ".")), ".");
    const host = join(tail(split(new URL(serverUri).hostname, ".")), ".");
    if (host === remote) {
      // see for reference: https://code.visualstudio.com/api/references/vscode-api#Extension
      if (
        extensions.getExtension("SAPOSS.app-studio-toolkit")?.extensionKind ===
        ExtensionKind.Workspace
      ) {
        return true;
      }
    }
  }
  return false;
}
