import { URL } from "url";
import { Uri, env } from "vscode";

export function cmdOpenInVSCode(): void {
  void env.openExternal(
    Uri.parse(
      `vscode://SAPOSS.app-studio-toolkit/open?landscape=${
        new URL(process.env.H2O_URL || ``).hostname
      }&devspaceid=${(process.env.WORKSPACE_ID || ``)
        .split(`-`)
        .slice(1)
        .join(`-`)}`
    )
  );
}
