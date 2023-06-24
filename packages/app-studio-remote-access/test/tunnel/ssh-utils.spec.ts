import { expect } from "chai";
import { fail } from "assert";
import * as path from "path";
import { SinonMock, mock } from "sinon";
import { URL } from "node:url";
import { homedir } from "os";
import proxyquire from "proxyquire";
import * as sshutils from "../../src/tunnel/ssh-utils";
const sshConfig = require("ssh-config");

describe("ssh-utils unit test", () => {
  enum localConfigurationTarget {
    Global = 1,
    Workspace = 2,
    WorkspaceFolder = 3,
  }

  const configProxy = {
    get: () => {
      throw new Error(`not implemented`);
    },
    update: (
      key: string,
      data: any,
      target: typeof localConfigurationTarget
    ) => {},
  };

  const testVscode = {
    commands: {
      executeCommand: () => {
        throw new Error(`not implemented`);
      },
    },
    workspace: {
      getConfiguration: () => configProxy,
    },
    ConfigurationTarget: localConfigurationTarget,
  };

  let sshUtilsProxy: typeof sshutils;

  const remoteSshProxy = {
    remotessh: {
      getKey: () => {
        throw new Error(`not implemented`);
      },
    },
  };

  const fsProxy = {
    existsSync: () => {
      throw new Error(`not implemented`);
    },
    mkdirSync: () => {
      throw new Error(`not implemented`);
    },
    writeFileSync: (file: string, data: string) => {},
    unlinkSync: () => {
      throw new Error(`not implemented`);
    },
  };

  const SshProxy = {
    ssh: (opts: {
      host: {
        url: string;
        port: string;
      };
      client: {
        port: string;
      };
      username: string;
      jwt: string;
    }): Promise<void> => {
      throw new Error(`not implemented`);
    },
  };

  const dummyLogger = {
    info: () => "",
    error: () => "",
  };

  before(() => {
    sshUtilsProxy = proxyquire("../../src/tunnel/ssh-utils", {
      vscode: {
        workspace: testVscode.workspace,
        ConfigurationTarget: testVscode.ConfigurationTarget,
        commands: testVscode.commands,
        "@noCallThru": true,
      },
      "../logger/logger": {
        getLogger: () => dummyLogger,
      },
      "@sap/bas-sdk": remoteSshProxy,
      fs: fsProxy,
      "./ssh": SshProxy,
    });
  });

  let mockWorkspace: SinonMock;
  let mockWorkspaceConfig: SinonMock;
  let mockCommands: SinonMock;
  let mockFs: SinonMock;

  beforeEach(() => {
    mockWorkspace = mock(testVscode.workspace);
    mockWorkspaceConfig = mock(configProxy);
    mockCommands = mock(testVscode.commands);
    mockFs = mock(fsProxy);
  });

  afterEach(() => {
    mockWorkspace.verify();
    mockWorkspaceConfig.verify();
    mockCommands.verify();
    mockFs.verify();
  });

  const landscape = `https://my.landscape-1.com`;
  const wsId = `ws-id`;
  const dummyJwt = `dummy-token`;
  const key = `pak-key`;
  const node: sshutils.DevSpaceNode = <sshutils.DevSpaceNode>{
    id: `node-id`,
    landscapeUrl: landscape,
  };

  describe("getPK unit test", () => {
    let mockRemoteSsh: SinonMock;

    beforeEach(() => {
      mockRemoteSsh = mock(remoteSshProxy.remotessh);
    });

    afterEach(() => {
      mockRemoteSsh.verify();
    });

    it("getPK, succedded", async () => {
      mockCommands
        .expects("executeCommand")
        .withExactArgs("local-extension.get-jwt", landscape)
        .resolves(dummyJwt);
      mockRemoteSsh
        .expects("getKey")
        .withExactArgs(landscape, dummyJwt, wsId)
        .resolves(key);
      expect(await sshUtilsProxy.getPK(landscape, wsId)).to.be.equal(key);
    });

    it("getPK, exception thrown", async () => {
      const err = new Error(`command error`);
      mockCommands
        .expects("executeCommand")
        .withExactArgs("local-extension.get-jwt", landscape)
        .rejects(err);
      try {
        await sshUtilsProxy.getPK(landscape, wsId);
        fail(`should fail`);
      } catch (e) {
        expect(e).to.be.deep.equal(err);
      }
    });
  });

  describe("savePK/deletePK unit test", () => {
    const configPath = `/my/config/path/test.cfg`;
    const folderPath = path.parse(configPath).dir;
    const fileName = path.join(folderPath, `${new URL(landscape).host}.key`);

    it("savePK, succedded, folder exists, config path configured", () => {
      mockWorkspace
        .expects("getConfiguration")
        .withExactArgs("remote.SSH")
        .returns(configProxy);
      mockWorkspaceConfig
        .expects(`get`)
        .withExactArgs(`configFile`)
        .returns(configPath);
      mockFs.expects(`existsSync`).withExactArgs(folderPath).returns(true);
      mockFs.expects(`existsSync`).withExactArgs(fileName).returns(false);
      mockFs
        .expects(`writeFileSync`)
        .withExactArgs(fileName, `${key}\n`, { mode: "0400", flag: "w" })
        .returns("");
      expect(sshUtilsProxy.savePK(key, landscape)).to.be.equal(fileName);
    });

    it("savePK, succedded, folder exists, config path system used", () => {
      const configPath = path.join(homedir(), ".ssh", "config");
      const folderPath = path.parse(configPath).dir;
      const fileName = path.join(folderPath, `${new URL(landscape).host}.key`);
      mockWorkspace
        .expects("getConfiguration")
        .withExactArgs("remote.SSH")
        .returns(configProxy);
      mockWorkspaceConfig
        .expects(`get`)
        .withExactArgs(`configFile`)
        .returns(undefined);
      mockFs.expects(`existsSync`).withExactArgs(folderPath).returns(true);
      mockFs.expects(`existsSync`).withExactArgs(fileName).returns(false);
      mockFs
        .expects(`writeFileSync`)
        .withExactArgs(fileName, `${key}\n`, { mode: "0400", flag: "w" })
        .returns("");
      expect(sshUtilsProxy.savePK(key, landscape)).to.be.equal(fileName);
    });

    it("savePK, succedded, folder doesn't exist, key file exists, config path configured", () => {
      mockWorkspace
        .expects("getConfiguration")
        .withExactArgs("remote.SSH")
        .returns(configProxy);
      mockWorkspaceConfig
        .expects(`get`)
        .withExactArgs(`configFile`)
        .returns(configPath);
      mockFs.expects(`existsSync`).withExactArgs(folderPath).returns(false);
      mockFs.expects(`mkdirSync`).withExactArgs(folderPath).returns(true);
      mockFs.expects(`existsSync`).withExactArgs(fileName).returns(true);
      mockFs.expects(`unlinkSync`).withExactArgs(fileName).returns(true);
      mockFs
        .expects(`writeFileSync`)
        .withExactArgs(fileName, `${key}\n`, { mode: "0400", flag: "w" })
        .returns("");
      expect(sshUtilsProxy.savePK(key, landscape)).to.be.equal(fileName);
    });

    it("deletePK, succedded, file exists, config path configured", () => {
      mockWorkspace
        .expects("getConfiguration")
        .withExactArgs("remote.SSH")
        .returns(configProxy);
      mockWorkspaceConfig
        .expects(`get`)
        .withExactArgs(`configFile`)
        .returns(configPath);
      mockFs.expects(`existsSync`).withExactArgs(fileName).returns(true);
      mockFs.expects(`unlinkSync`).withExactArgs(fileName).returns("");
      sshUtilsProxy.deletePK(landscape);
    });

    it("deletePK, succedded, file doesn't exist, config path configured", () => {
      mockWorkspace
        .expects("getConfiguration")
        .withExactArgs("remote.SSH")
        .returns(configProxy);
      mockWorkspaceConfig
        .expects(`get`)
        .withExactArgs(`configFile`)
        .returns(configPath);
      mockFs.expects(`existsSync`).withExactArgs(fileName).returns(false);
      mockFs.expects(`unlinkSync`).withExactArgs(fileName).never();
      sshUtilsProxy.deletePK(landscape);
    });
  });

  describe("updateSSHConfig unit tests", () => {
    const configPath = `/my/config/path/test.cfg`;
    const fileName = path.join(
      `/my/config/path`,
      `${new URL(landscape).host}.key`
    );

    it("updateSSHConfig, succedded, config not existed", () => {
      mockWorkspace
        .expects("getConfiguration")
        .withExactArgs("remote.SSH")
        .returns(configProxy);
      mockWorkspaceConfig
        .expects(`get`)
        .withExactArgs(`configFile`)
        .returns(configPath);
      mockFs.expects(`existsSync`).withExactArgs(configPath).returns(false);
      mockFs.expects(`writeFileSync`).withArgs(configPath).returns("");
      const configInfo = sshUtilsProxy.updateSSHConfig(fileName, node);
      expect(configInfo.name).to.be.equal(
        `${new URL(node.landscapeUrl).host}.${node.id}`
      );
      expect(parseInt(configInfo.port)).to.be.gt(30432);
      expect(parseInt(configInfo.port)).to.be.lt(33654);
    });

    it("updateSSHConfig, succedded, config exists", () => {
      const data = `
Host ${`${new URL(landscape).host}.${node.id}`}
HostName 127.0.0.1
Port ${1234}
IdentityFile ${fileName}
User user
NoHostAuthenticationForLocalhost yes
`;
      mockWorkspace
        .expects("getConfiguration")
        .withExactArgs("remote.SSH")
        .returns(configProxy);
      mockWorkspaceConfig
        .expects(`get`)
        .withExactArgs(`configFile`)
        .returns(configPath);
      mockFs.expects(`existsSync`).withExactArgs(configPath).returns(true);
      mockFs
        .expects(`readFileSync`)
        .withArgs(configPath)
        .returns(Buffer.from(data, `utf8`));
      mockFs.expects(`writeFileSync`).withArgs(configPath).returns("");
      const configInfo = sshUtilsProxy.updateSSHConfig(fileName, node);
      expect(configInfo.name).to.be.equal(
        `${new URL(node.landscapeUrl).host}.${node.id}`
      );
      expect(parseInt(configInfo.port)).to.be.gt(30432);
      expect(parseInt(configInfo.port)).to.be.lt(33654);
    });
  });

  describe("removeSSHConfig unit tests", () => {
    const configPath = `/my/config/path/test.cfg`;
    const fileName = path.join(
      `/my/config/path`,
      `${new URL(landscape).host}.key`
    );

    let data = `
Host ${`${new URL(landscape).host}.1`}
HostName 127.0.0.1
Port ${1234}
User user
`;
    it("removeSSHConfig, succedded, config section doesn't exist", () => {
      mockWorkspace
        .expects("getConfiguration")
        .withExactArgs("remote.SSH")
        .returns(configProxy);
      mockWorkspaceConfig
        .expects(`get`)
        .withExactArgs(`configFile`)
        .returns(configPath);
      mockFs.expects(`existsSync`).withExactArgs(configPath).returns(true);
      mockFs
        .expects(`readFileSync`)
        .withArgs(configPath)
        .returns(Buffer.from(data, `utf8`));
      let updatedConfig = "";
      fsProxy.writeFileSync = (file, data) => {
        updatedConfig = data;
      };
      sshUtilsProxy.removeSSHConfig(node);
      const config = sshConfig.parse(updatedConfig);
      expect(config.compute(`${`${new URL(landscape).host}.${node.id}`}`)).to.be
        .empty;
      expect(config.compute(`${`${new URL(landscape).host}.1`}`)).to.be.not
        .empty;
    });

    it("removeSSHConfig, succedded, config section exists", () => {
      data = `${data}

Host ${`${new URL(landscape).host}.${node.id}`}
HostName 127.0.0.1
Port ${1234}
`;
      mockWorkspace
        .expects("getConfiguration")
        .withExactArgs("remote.SSH")
        .returns(configProxy);
      mockWorkspaceConfig
        .expects(`get`)
        .withExactArgs(`configFile`)
        .returns(configPath);
      mockFs.expects(`existsSync`).withExactArgs(configPath).returns(true);
      mockFs
        .expects(`readFileSync`)
        .withArgs(configPath)
        .returns(Buffer.from(data, `utf8`));
      let updatedConfig = "";
      fsProxy.writeFileSync = (file, data) => {
        updatedConfig = data;
      };
      sshUtilsProxy.removeSSHConfig(node);
      const config = sshConfig.parse(updatedConfig);
      expect(config.compute(`${`${new URL(landscape).host}.${node.id}`}`)).to.be
        .empty;
      expect(config.compute(`${`${new URL(landscape).host}.1`}`)).to.be.not
        .empty;
    });

    it("removeSSHConfig, exception thrown", () => {
      const err = new Error(`error`);
      mockWorkspace
        .expects("getConfiguration")
        .withExactArgs("remote.SSH")
        .returns(configProxy);
      mockWorkspaceConfig
        .expects(`get`)
        .withExactArgs(`configFile`)
        .returns(configPath);
      mockFs.expects(`existsSync`).withExactArgs(configPath).returns(true);
      mockFs.expects(`readFileSync`).withArgs(configPath).throws(err);
      try {
        sshUtilsProxy.removeSSHConfig(node);
      } catch (e) {
        expect(e.message).to.equal(err.message);
      }
    });
  });

  describe("platform settings unit tests", () => {
    const keySshRemotePlatform = `remote.SSH.remotePlatform`;
    const config: sshutils.SSHConfigInfo = {
      name: `${new URL(node.landscapeUrl).host}.${node.id}`,
      port: `12345`,
    };

    it("updateRemotePlatformSetting, config section doesn't exist", async () => {
      mockWorkspaceConfig
        .expects(`get`)
        .withExactArgs(keySshRemotePlatform)
        .returns(undefined);
      let settings: any;
      configProxy.update = (
        key: string,
        data: any,
        target: typeof localConfigurationTarget
      ) => {
        expect(key).to.be.equal(keySshRemotePlatform);
        expect(target).to.be.equal(localConfigurationTarget.Global);
        settings = data;
        return Promise.resolve();
      };
      await sshUtilsProxy.updateRemotePlatformSetting(config);
      expect(settings[config.name]).to.be.equal(`linux`);
    });

    it("updateRemotePlatformSetting, config section exists", async () => {
      let settings: any = {};
      settings[config.name] = "windows";
      mockWorkspaceConfig
        .expects(`get`)
        .withExactArgs(keySshRemotePlatform)
        .returns(settings);

      configProxy.update = (
        key: string,
        data: any,
        target: typeof localConfigurationTarget
      ) => {
        expect(key).to.be.equal(keySshRemotePlatform);
        expect(target).to.be.equal(localConfigurationTarget.Global);
        settings = data;
        return Promise.resolve();
      };
      await sshUtilsProxy.updateRemotePlatformSetting(config);
      expect(settings[config.name]).to.be.equal(`linux`);
    });

    it("updateRemotePlatformSetting, exception thrown", async () => {
      const err = new Error("error");
      mockWorkspaceConfig
        .expects(`get`)
        .withExactArgs(keySshRemotePlatform)
        .throws(err);
      try {
        await sshUtilsProxy.updateRemotePlatformSetting(config);
      } catch (e) {
        expect(e.message).to.be.equal(err.message);
      }
    });

    it("cleanRemotePlatformSetting, config section exists", async () => {
      let settings: any = {};
      settings[`${new URL(node.landscapeUrl).host}.${node.id}`] = "windows";
      mockWorkspaceConfig
        .expects(`get`)
        .withExactArgs(keySshRemotePlatform)
        .returns(settings);
      configProxy.update = (
        key: string,
        data: any,
        target: typeof localConfigurationTarget
      ) => {
        expect(key).to.be.equal(keySshRemotePlatform);
        expect(target).to.be.equal(localConfigurationTarget.Global);
        settings = data;
        return Promise.resolve();
      };
      await sshUtilsProxy.cleanRemotePlatformSetting(node);
      expect(settings).to.be.deep.equal({});
    });

    it("cleanRemotePlatformSetting, config section doesn't exist", async () => {
      let settings = { section: `linux` };
      mockWorkspaceConfig
        .expects(`get`)
        .withExactArgs(keySshRemotePlatform)
        .returns(settings);
      configProxy.update = (
        key: string,
        data: any,
        target: typeof localConfigurationTarget
      ) => {
        expect(key).to.be.equal(keySshRemotePlatform);
        expect(target).to.be.equal(localConfigurationTarget.Global);
        settings = data;
        return Promise.resolve();
      };
      await sshUtilsProxy.cleanRemotePlatformSetting(node);
      expect(settings).to.be.deep.equal({ section: `linux` });
    });

    it("cleanRemotePlatformSetting, config doesn't exist", async () => {
      let settings;
      mockWorkspaceConfig
        .expects(`get`)
        .withExactArgs(keySshRemotePlatform)
        .returns(settings);
      configProxy.update = (
        key: string,
        data: any,
        target: typeof localConfigurationTarget
      ) => {
        expect(key).to.be.equal(keySshRemotePlatform);
        expect(target).to.be.equal(localConfigurationTarget.Global);
        settings = data;
        return Promise.resolve();
      };
      await sshUtilsProxy.cleanRemotePlatformSetting(node);
      expect(settings).to.be.deep.equal({});
    });

    it("cleanRemotePlatformSetting, exception thrown", async () => {
      const err = new Error("error");
      mockWorkspaceConfig
        .expects(`get`)
        .withExactArgs(keySshRemotePlatform)
        .throws(err);
      try {
        await sshUtilsProxy.cleanRemotePlatformSetting(node);
      } catch (e) {
        expect(e.message).to.be.equal(err.message);
      }
    });
  });

  describe("runChannelClient unit test", () => {
    let mockSsh: SinonMock;

    beforeEach(() => {
      mockSsh = mock(SshProxy);
    });

    afterEach(() => {
      mockSsh.verify();
    });

    const options = {
      host: `https://devspace-host.my`,
      landscape,
      localPort: `12345`,
    };

    it("runChannelClient, succedded", async () => {
      mockCommands
        .expects("executeCommand")
        .withExactArgs("local-extension.get-jwt", landscape)
        .resolves(dummyJwt);
      mockSsh
        .expects("ssh")
        .withExactArgs({
          host: {
            url: options.host,
            port: `443`,
          },
          client: {
            port: options.localPort,
          },
          username: `user`,
          jwt: dummyJwt,
        })
        .resolves();
      await sshUtilsProxy.runChannelClient(options);
    });

    it("runChannelClient, exception thrown", async () => {
      const err = new Error(`get jwt error`);
      mockCommands
        .expects("executeCommand")
        .withExactArgs("local-extension.get-jwt", landscape)
        .rejects(err);
      return sshUtilsProxy
        .runChannelClient(options)
        .then(() => fail(`should fail`))
        .catch((e) => {
          expect(e).to.be.deep.equal(err);
        });
    });
  });

  describe("getRandomArbitrary unit test", () => {
    it("getRandomArbitrary, no params", () => {
      const x = 30432,
        y = 33654;
      expect(sshUtilsProxy[`getRandomArbitrary`]()).to.be.gte(Math.min(x, y));
      expect(sshUtilsProxy[`getRandomArbitrary`]()).to.be.lte(Math.max(x, y));
    });

    it("getRandomArbitrary, range specified", () => {
      const x = 10001,
        y = 10010;
      expect(sshUtilsProxy[`getRandomArbitrary`](x, y)).to.be.gte(
        Math.min(x, y)
      );
      expect(sshUtilsProxy[`getRandomArbitrary`](x, y)).to.be.lte(
        Math.max(x, y)
      );
    });

    it("getRandomArbitrary, range specified inverse", () => {
      const x = 2543,
        y = 1987;
      expect(sshUtilsProxy[`getRandomArbitrary`](x, y)).to.be.gte(
        Math.min(x, y)
      );
      expect(sshUtilsProxy[`getRandomArbitrary`](x, y)).to.be.lte(
        Math.max(x, y)
      );
    });
  });
});
