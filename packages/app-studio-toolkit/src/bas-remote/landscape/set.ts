import { window, commands, workspace, ConfigurationTarget } from "vscode";
import { compact, trim } from "lodash";
import { URL } from "node:url";

export async function cmdLandscapeSet(): Promise<void> {
  let landscape = await window.showInputBox({
    prompt: "Landscape Url",
    value: "https://bas-extensions.stg10cf.int.applicationstudio.cloud.sap",
    ignoreFocusOut: true,
    validateInput: (v: string) => {
      try {
        new URL(v);
      } catch (e) {
        return (e as Error).toString();
      }
    },
  });

  if (landscape) {
    landscape = new URL(landscape).toString();
    await addLandscape(landscape);
    void commands.executeCommand("local-extension.tree.refresh");
  }
}

async function addLandscape(landscapeName: string): Promise<void> {
  const config = workspace
    .getConfiguration()
    .get<string>("sap-remote.landscape-name");
  const landscapes = compact((config ?? "").split(",").map((v) => trim(v)));
  if (!landscapes.find((v) => v === landscapeName)) {
    landscapes.push(landscapeName);
    await workspace
      .getConfiguration()
      .update(
        "sap-remote.landscape-name",
        landscapes.join(","),
        ConfigurationTarget.Global
      );
  }
}
