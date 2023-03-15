import { window, workspace } from "vscode";
import * as url from "url";
// import { waccess, wOP } from "../utils";
import { getLogger } from "../../logger/logger";
import { messages } from "../messages";
import * as path from "path";
import * as fs from "fs";
import { homedir } from "os";
const sshConfig = require("ssh-config");
import { DevSpaceNode } from "../tree/treeItems";
import { getJwt } from "../../auth/authentication";
import { isEmpty } from "lodash";
import { ChildProcess } from "child_process";
// import { ssh } from "@devx-wing/dev-tunnels";

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
  adminUrl: string,
  landscapeUrl: string
): Promise<string> {
  return Promise.resolve("");
  // return waccess(wOP.GET, { landscape: landscapeUrl, path: `key`, host: adminUrl })
  //   .then((response) => {
  //     return response.data as string;
  //   })
  //   .catch((error: Error) => {
  //     const message = messages.err_get_key(error.toString());
  //     getLogger().error(message);
  //     void window.showErrorMessage(message);
  //     return "";
  //   });
}

export function savePK(pk: string, urlStr: string): string | undefined {
  try {
    //construct file named "<ws-url>.key"
    const urlObj: url.UrlWithStringQuery = url.parse(urlStr);
    const sshFolderPath: string = getSshConfigFolderPath();
    const fileName: string = path.join(sshFolderPath, `${urlObj.host}.key`);

    if (!fs.existsSync(sshFolderPath)) {
      fs.mkdirSync(sshFolderPath);
    }
    if (fs.existsSync(fileName)) {
      fs.unlinkSync(fileName);
    }
    fs.writeFileSync(fileName, `${pk}\n`, { mode: "0400", flag: "w" });
    getLogger().info(`Private Key file ${fileName} created`);
    return fileName;
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- suppress warn
    const message: string = e.toString();
    getLogger().error(message);
    void window.showErrorMessage(message);
  }
}

function getSSHConfig(sshConfigFile: string): typeof sshConfig | undefined {
  if (fs.existsSync(sshConfigFile)) {
    const configData: Buffer = fs.readFileSync(sshConfigFile);
    getLogger().info(`SSH Config file ${sshConfigFile} exists`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- suppress
    return sshConfig.parse(configData.toString());
  } else {
    getLogger().info(
      `SSH Config file ${sshConfigFile} doest exist, creating new file`
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- suppress
    return sshConfig.parse({});
  }
}

export function updateSSHConfig(
  sshKeyFilePath: string,
  devSpace: DevSpaceNode
): SSHConfigInfo | undefined {
  const urlObj: url.UrlWithStringQuery = url.parse(devSpace.landscapeUrl);
  const sectionName = `${urlObj.host}.${devSpace.id}`;
  const sshConfigFile: string = getSshConfigFilePath();
  const port = "8080";
  try {
    // get ssh config object form ssh config file
    const config = getSSHConfig(sshConfigFile);
    // push to the ssh config object with the new configuration
    config.remove({ Host: sectionName });
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
    const configData: string = sshConfig.stringify(config);
    fs.writeFileSync(sshConfigFile, configData);
    return { name: sectionName, port: port } as SSHConfigInfo;
  } catch (err) {
    const message = messages.err_config_update(
      sshConfigFile,
      (err as Error).toString()
    );
    getLogger().error(message);
    void window.showErrorMessage(message);
  }
}

// function getDevChannelPath(): string {
//   return path.resolve(__dirname, "..", "scripts", "cli.js").replace(/\\/g, "/");
// }

export async function runChannelClientAsProcess(opt: {
  host: string;
  landscape: string;
}): Promise<ChildProcess | undefined> {
  const urlObj: url.UrlWithStringQuery = url.parse(opt.host);
  // const channelOsPath: string = getDevChannelPath();
  const port = 443;
  const jwt = await getJwt(opt.landscape);
  if (isEmpty(jwt)) {
    return;
  }

  getLogger().info(`Start dev-channel client for ${opt.host} on port ${port}`);

  // void ssh(url.format(urlObj), port, "user", jwt!, { Reconnect: "true" });

  // const channelProcess = exec(`node ${channelOsPath} ssh ${url.format(urlObj)} -j ${jwt} -p ${port} -l user`);

  // return new Promise((resolve, reject) => {
  //   const channelOutput = {
  //     resolved: false,
  //     retries: 0,

  //     stdoutLine(msg: string) {
  //       // TODO: handel all errors
  //       if (!this.resolved && msg.includes("connected")) {
  //         this.resolved = true;
  //         return resolve(channelProcess);
  //       }
  //       if (!this.resolved && msg.includes("client: Retrying")) {
  //         this.retries++;
  //         if (this.retries > 3) {
  //           //fails:
  //           this.resolved = true;
  //           // reject('Cannot establish tunnel to dev-space');
  //           return reject(channelProcess);
  //         }
  //       }
  //       getLogger().info(`channel: ${msg}`);
  //     },
  //     stderrLine(msg: string) {
  //       getLogger().error(`channel-err: ${msg}`);
  //       return reject(msg);
  //     },
  //   };

  //   channelProcess.stdout?.on("data", (data: string) => {
  //     channelOutput.stdoutLine(data.toString());
  //   });

  //   channelProcess.stderr?.on("data", (data: string) => {
  //     channelOutput.stdoutLine(data.toString());
  //   });

  //   channelProcess.on("exit", (code: number, signal: string) => {
  //     code == 0
  //       ? channelOutput.stdoutLine(`Exit: code ${code} and siganl: ${signal}`)
  //       : channelOutput.stderrLine(`Exit: code ${code} and siganl: ${signal}`);
  //   });

  //   channelProcess.on("error", (err) => {
  //     channelOutput.stderrLine(`Error: ${err.message}`);
  //   });
  // });
}
