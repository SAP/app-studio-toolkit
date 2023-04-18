import { window, commands } from "vscode";
import { getLogger } from "../../logger/logger";
import { DevSpaceNode } from "../tree/treeItems";
import { messages } from "../common/messages";
import { getJwt } from "../../authentication/auth-utils";
import { devspace } from "@sap/bas-sdk";
import { RefreshRate, autoRefresh } from "../landscape/landscape";
import { DevSpaceStatus, getDevSpaces } from "./devspace";

const START = false;
const STOP = true;

export async function cmdDevSpaceStart(devSpace: DevSpaceNode): Promise<void> {
  const canRun = await isItPossibleToStart(devSpace.landscapeUrl);
  if (typeof canRun === `boolean` && canRun === true) {
    return updateDevSpace(
      devSpace.landscapeUrl,
      devSpace.id,
      devSpace.label,
      START
    );
  } else if (typeof canRun === `string`) {
    void window.showInformationMessage(canRun);
  }
}

async function isItPossibleToStart(
  landscapeUrl: string
): Promise<boolean | string> {
  const devSpaces = await getDevSpaces(landscapeUrl);
  if (!devSpaces) {
    // failure to obtain devspace info
    return false;
  }
  if (
    devSpaces.filter(
      (devspace) =>
        devspace.status === DevSpaceStatus.RUNNING ||
        devspace.status === DevSpaceStatus.STARTING
    ).length < 2
  ) {
    return true;
  } else {
    getLogger().info(`There are 2 dev spaces running for ${landscapeUrl}`);
    return messages.info_can_run_only_2_devspaces;
  }
}

export async function cmdDevSpaceStop(devSpace: DevSpaceNode): Promise<void> {
  return updateDevSpace(
    devSpace.landscapeUrl,
    devSpace.id,
    devSpace.label,
    STOP
  );
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
          getLogger().info(
            messages.info_devspace_state_updated(wsName, wsId, suspend)
          );
          void window.showInformationMessage(
            messages.info_devspace_state_updated(wsName, wsId, suspend)
          );
          autoRefresh(RefreshRate.SEC_10, RefreshRate.MIN_2);
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
