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
        const url = new URL(value);
        if (url.pathname.length > 1 || url.search || url.hash) {
          return "Enter the URL origin without any paths or parameters";
        }
      } catch (e) {
        return (e as Error).toString();
      }
    },
  });

  if (landscape) {
    // const isDefault = await window.showQuickPick(["set as default"], {
    //   placeHolder: "Whether to set this landscape as the default for outbound connectivity",
    //   canPickMany: true,
    //   ignoreFocusOut: true
    // });
    // if(isDefault) {
    // continue if user not cancelled
    return addLandscape(landscape).finally(
      () => void commands.executeCommand("local-extension.tree.refresh")
    );
    // }
  }
}

export async function addLandscape(landscapeName: string): Promise<void> {
  const toAdd = new URL(landscapeName).toString();
  const landscapes = getLanscapesConfig();
  if (
    !landscapes.find((landscape) => new URL(landscape.url).toString() === toAdd)
  ) {
    landscapes.push({ url: toAdd });
    return updateLandscapesConfig(landscapes);
  }
}
