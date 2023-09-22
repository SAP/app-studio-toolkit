import {
  workspace,
  ConfigurationTarget,
  commands,
  authentication,
} from "vscode";
import { getLogger } from "../logger/logger";
import * as path from "path";
import * as fs from "fs";
import { homedir } from "os";
import { remotessh } from "@sap/bas-sdk";
import { ssh } from "./ssh";
import { URL } from "node:url";
import { assign, unset } from "lodash";
const sshConfig = require("ssh-config");

export const SSHD_SOCKET_PORT = 33765;
export const SSH_SOCKET_PORT = 443;
const KEY_SSH_REMOTE_PLATFORM = "remote.SSH.remotePlatform";

export interface DevSpaceNode {
  label: string;
  id: string;
  landscapeUrl: string;
  wsUrl: string;
}

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

async function getJwt(landscape: string): Promise<string> {
  return authentication
    .getSession("BASLandscapePAT", [landscape], { createIfNone: true })
    .then((session) => session?.accessToken ?? "");
}

export async function getPK(
  landscapeUrl: string,
  wsId: string
): Promise<string> {
  return getJwt(landscapeUrl).then((jwt) => {
    return remotessh.getKey(landscapeUrl, jwt, wsId);
  });
}

function composeKeyFileName(folder: string, url: string): string {
  return path.join(folder, `${new URL(url).host}.key`);
}

export function savePK(pk: string, urlStr: string): string {
  //construct file named "<ws-url>.key"
  const sshFolderPath: string = getSshConfigFolderPath();
  if (!fs.existsSync(sshFolderPath)) {
    fs.mkdirSync(sshFolderPath);
  }

  const fileName: string = composeKeyFileName(sshFolderPath, urlStr);
  if (fs.existsSync(fileName)) {
    fs.unlinkSync(fileName);
  }
  fs.writeFileSync(fileName, `${pk}\n`, { mode: "0400", flag: "w" });
  getLogger().info(`Private key file ${fileName} created`);
  return fileName;
}

export function deletePK(wsUrl: string): void {
  const fileName: string = composeKeyFileName(getSshConfigFolderPath(), wsUrl);
  let message = `Private key file ${fileName} deleted`;
  if (fs.existsSync(fileName)) {
    fs.unlinkSync(fileName);
  } else {
    message = `Private key file ${fileName} doesn't exists`;
  }
  getLogger().info(message);
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
    Host: `${composeSSHConfigSectionName(devSpace.landscapeUrl, devSpace.id)}`,
  });
  //save the ssh config object back to file
  fs.writeFileSync(sshConfigFile, sshConfig.stringify(config));
}

export async function updateRemotePlatformSetting(
  config: SSHConfigInfo
): Promise<void> {
  const remotePlatform: any = {};
  remotePlatform[config.name] = "linux";

  const remotePlatformsList =
    workspace.getConfiguration().get(KEY_SSH_REMOTE_PLATFORM) || {};
  assign(remotePlatformsList, remotePlatform);
  await workspace
    .getConfiguration()
    .update(
      KEY_SSH_REMOTE_PLATFORM,
      remotePlatformsList,
      ConfigurationTarget.Global
    );
}

export async function cleanRemotePlatformSetting(
  devSpace: DevSpaceNode
): Promise<void> {
  const remotePlatform =
    workspace.getConfiguration().get(KEY_SSH_REMOTE_PLATFORM) || {};
  const sectionName = composeSSHConfigSectionName(
    devSpace.landscapeUrl,
    devSpace.id
  );
  unset(remotePlatform, sectionName);

  await workspace
    .getConfiguration()
    .update(
      KEY_SSH_REMOTE_PLATFORM,
      remotePlatform,
      ConfigurationTarget.Global
    );
}

export async function runChannelClient(opt: {
  host: string;
  landscape: string;
  localPort: string;
}): Promise<void> {
  return getJwt(opt.landscape).then((jwt) => {
    void ssh({
      host: { url: opt.host, port: `${SSH_SOCKET_PORT}` },
      client: { port: opt.localPort },
      username: "user",
      jwt,
    });
    getLogger().info(
      `Start dev-channel client for ${opt.host} on port ${SSH_SOCKET_PORT}`
    );
  });
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
