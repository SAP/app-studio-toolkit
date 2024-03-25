import { URL } from "url";
import { Uri, env, window } from "vscode";

export async function cmdOpenInVSCode(): Promise<void> {
  const folderPath = await window.showInputBox({
    placeHolder: "Enter folder path...",
  });
  void env.openExternal(
    Uri.parse(
      `vscode://SAPOSS.app-studio-toolkit/open?landscape=${
        new URL(process.env.H2O_URL || ``).hostname
      }&devspaceid=${(process.env.WORKSPACE_ID || ``)
        .split(`-`)
        .slice(1)
        .join(`-`)}&folderpath=${folderPath}`
    )
  );
}
