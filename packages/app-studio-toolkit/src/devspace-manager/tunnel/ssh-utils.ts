import { workspace, ConfigurationTarget } from "vscode";
import { getLogger } from "../../logger/logger";
import * as path from "path";
import * as fs from "fs";
import { homedir } from "os";
import { DevSpaceNode } from "../tree/treeItems";
import { getJwt } from "../../authentication/auth-utils";
import { remotessh } from "@sap/bas-sdk";
import { ssh } from "./ssh";
import { URL } from "node:url";
import { assign, unset } from "lodash";
const sshConfig = require("ssh-config");

export const SSHD_SOCKET_PORT = 33765;
export const SSH_SOCKET_PORT = 443;

export interface SSHConfigInfo {
  name: string;
  port: string;
}

function getSshConfigFilePath(): string {
  return (
    workspace.getConfiguration("remote.SSH").get("configFile") ||
    path.join(homedir(), ".ssh", "config")
  );
}

function getSshConfigFolderPath(): string {
  return path.parse(getSshConfigFilePath()).dir;
}

export async function getPK(
  landscapeUrl: string,
  wsId: string
): Promise<string> {
  return getJwt(landscapeUrl).then((jwt) => {
    return remotessh.getKey(landscapeUrl, jwt, wsId);
  });
}

export function savePK(pk: string, urlStr: string): string {
  //construct file named "<ws-url>.key"
  const sshFolderPath: string = getSshConfigFolderPath();
  if (!fs.existsSync(sshFolderPath)) {
    fs.mkdirSync(sshFolderPath);
  }

  const fileName: string = path.join(
    sshFolderPath,
    `${new URL(urlStr).host}.key`
  );
  if (fs.existsSync(fileName)) {
    fs.unlinkSync(fileName);
  }
  fs.writeFileSync(fileName, `${pk}\n`, { mode: "0400", flag: "w" });
  getLogger().info(`Private key file ${fileName} created`);
  return fileName;
}

export function deletePK(wsUrl: string): void {
  const fileName: string = path.join(
    getSshConfigFolderPath(),
    `${new URL(wsUrl).host}.key`
  );
  if (fs.existsSync(fileName)) {
    fs.unlinkSync(fileName);
    getLogger().info(`Private key file ${fileName} deleted`);
  } else {
    getLogger().info(`Private key file ${fileName} doesn't exists`);
  }
}

function getSSHConfig(sshConfigFile: string): typeof sshConfig | undefined {
  let configData: Buffer;
  if (fs.existsSync(sshConfigFile)) {
    configData = fs.readFileSync(sshConfigFile);
    getLogger().info(`SSH Config file ${sshConfigFile} exists`);
  } else {
    configData = Buffer.from(``, `utf8`);
    getLogger().info(
      `SSH Config file ${sshConfigFile} doest exist, creating new file`
    );
  }
  return sshConfig.parse(configData.toString());
}

function composeSSHConfigSectionName(landscape: string, wsId: string): string {
  return `${new URL(landscape).host}.${wsId}`;
}

export function updateSSHConfig(
  sshKeyFilePath: string,
  devSpace: DevSpaceNode
): SSHConfigInfo {
  const sectionName = composeSSHConfigSectionName(
    devSpace.landscapeUrl,
    devSpace.id
  );
  const sshConfigFile: string = getSshConfigFilePath();
  const port = getRandomArbitrary();
  // get ssh config object form ssh config file
  const config = getSSHConfig(sshConfigFile);
  // push to the ssh config object with the new configuration
  config.remove({ Host: sectionName });
  // keep the existing indentation of the next block
  config.push(
    sshConfig.parse(`Host ${sectionName}
  HostName 127.0.0.1
  Port ${port}
  IdentityFile ${sshKeyFilePath}
  User user
  NoHostAuthenticationForLocalhost yes
`)[0]
  );
  //save the ssh config object back to file
  fs.writeFileSync(sshConfigFile, sshConfig.stringify(config));
  return { name: sectionName, port: `${port}` } as SSHConfigInfo;
}

export function removeSSHConfig(devSpace: DevSpaceNode): void {
  const sshConfigFile: string = getSshConfigFilePath();
  // get ssh config object form ssh config file
  const config = getSSHConfig(sshConfigFile);
  // remove the section by name
  config.remove({
    Host: `${new URL(devSpace.landscapeUrl).host}.${devSpace.id}`,
  });
  //save the ssh config object back to file
  fs.writeFileSync(sshConfigFile, sshConfig.stringify(config));
}

export async function updateRemotePlatformSetting(config: SSHConfigInfo) {
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

export async function cleanRemotePlatformSetting(
  devSpace: DevSpaceNode
): Promise<void> {
  const remotePlatform: any = {};
  const remotePlatformsList =
    workspace.getConfiguration().get("remote.SSH.remotePlatform") || {};
  const sectionName = composeSSHConfigSectionName(
    devSpace.landscapeUrl,
    devSpace.id
  );
  assign(remotePlatform, remotePlatformsList);
  unset(remotePlatform, sectionName);

  await workspace
    .getConfiguration()
    .update(
      "remote.SSH.remotePlatform",
      remotePlatform,
      ConfigurationTarget.Global
    );
}

export async function runChannelClientAsProcess(opt: {
  host: string;
  landscape: string;
  localPort: string;
}): Promise<void> {
  void ssh({
    host: { url: opt.host, port: `${SSH_SOCKET_PORT}` },
    client: { port: opt.localPort },
    username: "user",
    jwt: await getJwt(opt.landscape),
  });

  getLogger().info(
    `Start dev-channel client for ${opt.host} on port ${SSH_SOCKET_PORT}`
  );
}

export function getRandomArbitrary(min?: number, max?: number): number {
  max = max || 33654;
  min = min || 30432;
  // verify max is larger than min
  const tmp = Math.max(min, max);
  if (tmp !== max) {
    // swap min <-> max
    min = max;
    max = tmp;
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
