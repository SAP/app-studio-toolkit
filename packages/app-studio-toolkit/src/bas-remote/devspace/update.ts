import { window, commands } from "vscode";
import { getLogger } from "../../logger/logger";
import { DevSpaceNode } from "../tree/treeItems";
import { autoRefresh, RefreshRate } from "../utils";
import { messages } from "../messages";
import { getJwt } from "../../auth/authentication";
import { devspace } from "@sap/bas-sdk";

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
) {
  try {
    const jwt = await getJwt(landscapeUrl);
    if (!jwt) {
      throw new Error(`authorization token can't be obtained`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- suppress warn
    return (
      devspace
        .updateDevSpace(
          landscapeUrl,
          wsId,
          { Suspended: suspend, WorkspaceDisplayName: wsName },
          jwt
        )
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- suppress warn
        .then((_) => {
          const status: string = suspend ? "stoped" : "started";
          getLogger().info(`WS ${wsName} (${wsId}) was ${status}`);
          void window.showInformationMessage(
            `WS ${wsName} (${wsId}) was ${status}`
          );
          void commands.executeCommand("local-extension.tree.refresh");
        })
    );
  } catch (e) {
    const message = messages.err_ws_update(wsId, e.toString());
    getLogger().error(message);
    void window.showErrorMessage(message);
  }
}
