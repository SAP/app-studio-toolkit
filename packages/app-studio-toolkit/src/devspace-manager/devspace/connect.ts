import {
  window,
  workspace,
  ProgressLocation,
  commands,
  ConfigurationTarget,
  env,
  Uri,
} from "vscode";
import type { Progress } from "vscode";
import { DevSpaceNode } from "../tree/treeItems";
import urljoin from "url-join";
import { assign } from "lodash";
import { ChildProcess } from "child_process";
import { URL } from "node:url";
import {
  getPK,
  runChannelClientAsProcess,
  savePK,
  SSHConfigInfo,
  SSHD_SOCKET_PORT,
  updateSSHConfig,
} from "../../tunnel/ssh-utils";

let tunnel: ChildProcess | undefined;

async function getTunnelConfigurations(
  devSpace: DevSpaceNode,
  progress: Progress<{ message?: string; increment?: number }>
): Promise<SSHConfigInfo | undefined> {
  // Obtaining SSH key
  progress.report({ message: "Obtaining SSH key" });
  const sshAdminUrl = new URL(devSpace.wsUrl);
  sshAdminUrl.hostname = `port35000-${sshAdminUrl.hostname}`;
  sshAdminUrl.pathname = `key`;
  const pk = await getPK(sshAdminUrl.toString(), devSpace.landscapeUrl);
  if (!pk) {
    return;
  }
  // Save PK to file
  progress.report({ message: "Save PK to file" });
  const pkFilePath = savePK(pk, devSpace.wsUrl);
  if (!pkFilePath) {
    return;
  }
  // Update config file with SSH connection
  progress.report({ message: "Update config file with SSH connection" });
  return updateSSHConfig(pkFilePath, devSpace);
}

export function closeTunnel(): boolean {
  return tunnel?.kill() || false;
}

async function createTunnel(
  devSpace: DevSpaceNode,
  config: SSHConfigInfo,
  progress: Progress<{ message?: string; increment?: number }>
): Promise<any> {
  progress.report({ message: "Closing old VPN tunnel to dev-space" });
  closeTunnel();

  // Start chisel tunnel
  progress.report({ message: "Starting new VPN tunnel to dev-space" });
  tunnel = await runChannelClientAsProcess({
    host: `port${SSHD_SOCKET_PORT}-${new URL(devSpace.wsUrl).hostname}`,
    landscape: devSpace.landscapeUrl,
    localPort: config.port,
  });
  // Stability of tunnel time
  // progress.report({ message: "Waiting for VPN tunnel to dev-space stability" });
}

async function createTunnelAndGetHostName(
  devSpace: DevSpaceNode
): Promise<string | undefined> {
  return window.withProgress<string | undefined>(
    {
      location: ProgressLocation.Notification,
      title: "Connecting to " + devSpace.label,
      cancellable: true,
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- suppress warn
    async (progress, cancel) => {
      // Set tunnel configurations
      const config = await getTunnelConfigurations(devSpace, progress);
      if (config) {
        // Create tunnel
        await createTunnel(devSpace, config, progress);
        // Add linux to host records in settings json
        await updateRemotePlatformSetting(config);
        return config.name;
      }
    }
  );
}

async function updateRemotePlatformSetting(config: SSHConfigInfo) {
  const remotePlatform: any = {};
  remotePlatform[config.name] = "linux";

  const remotePlatformsList =
    workspace.getConfiguration().get("remote.SSH.remotePlatform") || {};
  assign(remotePlatform, remotePlatformsList);
  await workspace
    .getConfiguration()
    .update(
      "remote.SSH.remotePlatform",
      remotePlatform,
      ConfigurationTarget.Global
    );
}

export async function cmdDevSpaceConnectNewWindow(
  devSpace: DevSpaceNode
): Promise<void> {
  const hostName = await createTunnelAndGetHostName(devSpace);
  void commands.executeCommand("opensshremotes.openEmptyWindow", {
    host: hostName,
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- temp suppress
export async function cmdDevSpaceConnectSameWindow(
  devSpace: DevSpaceNode
): Promise<void> {
  await window.showWarningMessage("This feature is not supported yet");
  // TODO: uncommnet when chisel is fixed
  // const hostName = await createTunnelAndGetHostName(devSpace);
  // await commands.executeCommand("opensshremotesexplorer.emptyWindowInCurrentWindow", {
  //   hostName: hostName
  // });
}

export async function cmdDevSpaceOpenInBAS(
  devSpace: DevSpaceNode
): Promise<boolean> {
  return env.openExternal(
    Uri.parse(urljoin(devSpace.landscapeUrl, `index.html`, `#${devSpace.id}`))
  );
}
