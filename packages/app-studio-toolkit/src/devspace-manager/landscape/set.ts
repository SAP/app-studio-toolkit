import { window, commands } from "vscode";
import { URL } from "node:url";
import { getLanscapesConfig, updateLandscapesConfig } from "./landscape";

export async function cmdLandscapeSet(): Promise<void> {
  /* istanbul ignore next */
  const landscape = await window.showInputBox({
    prompt: "Landscape url",
    ignoreFocusOut: true,
    validateInput: (value: string) => {
      try {
        new URL(value);
      } catch (e) {
        return (e as Error).toString();
      }
    },
  });

  if (landscape) {
    return addLandscape(landscape).finally(
      () => void commands.executeCommand("local-extension.tree.refresh")
    );
  }
}

export async function addLandscape(landscapeName: string): Promise<void> {
  const toAdd = new URL(landscapeName).toString();
  const landscapes = getLanscapesConfig();
  if (
    !landscapes.find((landscape) => new URL(landscape).toString() === toAdd)
  ) {
    landscapes.push(landscapeName);
    return updateLandscapesConfig(landscapes);
  }
}
