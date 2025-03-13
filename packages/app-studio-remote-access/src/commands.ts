import { window, ProgressLocation, commands, Uri } from "vscode";
import type { Progress } from "vscode";

import { URL } from "node:url";
import {
  cleanRemotePlatformSetting,
  deletePK,
  DevSpaceNode,
  getPK,
  removeSSHConfig,
  runChannelClient,
  savePK,
  SSHConfigInfo,
  SSHD_SOCKET_PORT,
  updateRemotePlatformSetting,
  updateSSHConfig,
} from "./tunnel/ssh-utils";
import { getLogger } from "./logger/logger";
import { messages } from "./messages";
import { closeSessions } from "./tunnel/ssh";

async function getTunnelConfigurations(
  devSpace: DevSpaceNode,
  progress: Progress<{ message?: string; increment?: number }>
): Promise<SSHConfigInfo> {
  progress.report({ message: messages.info_obtaining_key });
  const pk = await getPK(devSpace.landscapeUrl, devSpace.id);

  progress.report({ message: messages.info_save_pk_to_file });
  const pkFilePath = savePK(pk, devSpace.wsUrl);

  progress.report({
    message: messages.info_update_config_file_with_ssh_connection,
  });
  return updateSSHConfig(pkFilePath, devSpace);
}

export function closeTunnels(): void {
  closeSessions();
}

async function createTunnel(
  devSpace: DevSpaceNode,
  config: SSHConfigInfo,
  progress: Progress<{ message?: string; increment?: number }>
): Promise<any> {
  progress.report({ message: messages.info_closing_old_tunnel });

  progress.report({ message: messages.info_staring_new_tunnel });
  return runChannelClient({
    host: `port${SSHD_SOCKET_PORT}-${new URL(devSpace.wsUrl).hostname}`,
    landscape: devSpace.landscapeUrl,
    localPort: config.port,
  });
}

async function createTunnelAndGetHostName(
  devSpace: DevSpaceNode
): Promise<string | undefined> {
  return window.withProgress<string | undefined>(
    {
      location: ProgressLocation.Notification,
      title: `Connecting to ${devSpace.label}`,
      cancellable: true,
    },
    async (progress, cancel) => {
      // Set tunnel configurations
      const config = await getTunnelConfigurations(devSpace, progress);
      // Create tunnel
      await createTunnel(devSpace, config, progress);
      // Add linux to host records in settings json
      await updateRemotePlatformSetting(config);
      return config.name;
    }
  );
}

export async function cmdDevSpaceConnectNewWindow(
  devSpace: DevSpaceNode,
  folderPath: string | undefined
): Promise<void> {
  try {
    const hostName = await createTunnelAndGetHostName(devSpace);
    // Open the folder in a new window
    if (folderPath) {
      const uri = Uri.parse(
        `vscode-remote://ssh-remote+${hostName}${folderPath}`
      );
      void commands.executeCommand("vscode.openFolder", uri, {
        forceNewWindow: true,
      });
    }
    // Open an empty window
    else {
      await commands.executeCommand("opensshremotes.openEmptyWindow", {
        host: hostName,
      });
    }
  } catch (err) {
    const message = messages.err_devspace_connect_new_window(
      devSpace.wsUrl,
      err.toString()
    );
    getLogger().error(message);
    void window.showErrorMessage(message);
  }
}

export async function cleanDevspaceConfig(
  devSpace: DevSpaceNode
): Promise<void> {
  try {
    deletePK(devSpace.wsUrl);
    removeSSHConfig(devSpace);
    await cleanRemotePlatformSetting(devSpace);
    getLogger().info(`Devspace ssh config info cleaned`);
  } catch (e) {
    getLogger().error(
      `Can't complete the devspace ssh config cleaning: ${e.toString()}`
    );
  }
}
