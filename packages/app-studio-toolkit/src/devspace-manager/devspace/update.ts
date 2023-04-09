import { window, commands } from "vscode";
import { getLogger } from "../../logger/logger";
import { DevSpaceNode } from "../tree/treeItems";
import { messages } from "../common/messages";
import { getJwt } from "../../authentication/auth-utils";
import { devspace } from "@sap/bas-sdk";
import { RefreshRate, autoRefresh } from "../landscape/landscape";

const START = false;
const STOP = true;

export async function cmdDevSpaceStart(devSpace: DevSpaceNode): Promise<void> {
  await updateDevSpace(
    devSpace.landscapeUrl,
    devSpace.id,
    devSpace.label,
    START
  );
  autoRefresh(RefreshRate.SEC_10, RefreshRate.MIN_2);
}

export async function cmdDevSpaceStop(devSpace: DevSpaceNode): Promise<void> {
  await updateDevSpace(
    devSpace.landscapeUrl,
    devSpace.id,
    devSpace.label,
    STOP
  );
  autoRefresh(RefreshRate.SEC_10, RefreshRate.MIN_2);
}

async function updateDevSpace(
  landscapeUrl: string,
  wsId: string,
  wsName: string,
  suspend: boolean
): Promise<void> {
  return getJwt(landscapeUrl)
    .then((jwt) => {
      return devspace
        .updateDevSpace(landscapeUrl, jwt, wsId, {
          Suspended: suspend,
          WorkspaceDisplayName: wsName,
        })
        .then(() => {
          const message = `Devspace ${wsName} (${wsId}) was ${
            suspend ? "stoped" : "started"
          }`;
          getLogger().info(message);
          void window.showInformationMessage(message);
        });
    })
    .catch((e) => {
      const message = messages.err_ws_update(wsId, e.toString());
      getLogger().error(message);
      void window.showErrorMessage(message);
    })
    .finally(() => {
      void commands.executeCommand("local-extension.tree.refresh");
    });
}
