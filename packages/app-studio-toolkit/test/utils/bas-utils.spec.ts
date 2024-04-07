import { mockVscode } from "../mockUtil";
import { expect } from "chai";
import { SinonSandbox, SinonMock, createSandbox } from "sinon";

enum proxyExtensionKind {
  UI = 1,
  Workspace = 2,
}

const proxyEnv = {
  remoteName: undefined,
};

const proxyExtension = {
  getExtension: () => {
    throw new Error(`not implemented`);
  },
};

const proxyCommands = {
  executeCommand: () => {
    throw new Error(`not implemented`);
  },
};

const workspaceConfigurationMock = {
  update: () => "",
};

const testVscode = {
  extensions: proxyExtension,
  env: proxyEnv,
  ExtensionKind: proxyExtensionKind,
  commands: proxyCommands,
  ConfigurationTarget: {
    Global: 1,
  },
  workspace: {
    getConfiguration: () => workspaceConfigurationMock,
  },
};

mockVscode(testVscode, "dist/src/utils/bas-utils.js");
import {
  ExtensionRunMode,
  shouldRunCtlServer,
} from "../../src/utils/bas-utils";
import { devspace } from "@sap/bas-sdk";

describe("bas-utils unit test", () => {
  let sandbox: SinonSandbox;
  let mockExtension: SinonMock;
  let mockCommands: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    mockExtension = sandbox.mock(proxyExtension);
    mockCommands = sandbox.mock(proxyCommands);
  });

  afterEach(() => {
    mockExtension.verify();
    mockCommands.verify();
  });

  const landscape = `https://my-landscape.test.com`;

  describe("shouldRunCtlServer scope", () => {
    it("shouldRunCtlServer, running locally, process.env.WS_BASE_URL is undefined", () => {
      sandbox.stub(process, `env`).value({});
      mockCommands
        .expects(`executeCommand`)
        .withExactArgs(
          `setContext`,
          `ext.runPlatform`,
          ExtensionRunMode.desktop
        )
        .resolves();
      expect(shouldRunCtlServer()).to.be.false;
    });

    it("shouldRunCtlServer, running through ssh-remote, process.env.WS_BASE_URL is defined", () => {
      sandbox.stub(process, `env`).value({ WS_BASE_URL: landscape });
      sandbox.stub(proxyEnv, `remoteName`).value(`ssh-remote`);
      mockCommands
        .expects(`executeCommand`)
        .withExactArgs(
          `setContext`,
          `ext.runPlatform`,
          ExtensionRunMode.basRemote
        )
        .resolves();
      expect(shouldRunCtlServer()).to.be.true;
    });

    it("shouldRunCtlServer, running personal-edition", () => {
      const devspaceMock = sandbox.mock(devspace);
      devspaceMock.expects(`getBasMode`).returns(`personal-edition`);
      sandbox.stub(process, `env`).value({ WS_BASE_URL: landscape });
      sandbox.stub(proxyEnv, `remoteName`).value(undefined);
      mockCommands
        .expects(`executeCommand`)
        .withExactArgs(
          `setContext`,
          `ext.runPlatform`,
          ExtensionRunMode.desktop
        )
        .resolves();
      expect(shouldRunCtlServer()).to.be.true;
      devspaceMock.verify();
    });

    it("shouldRunCtlServer, running in BAS, extensionKind === 'Workspace'", () => {
      sandbox.stub(process, `env`).value({ WS_BASE_URL: landscape });
      sandbox.stub(proxyEnv, `remoteName`).value(landscape);
      mockExtension
        .expects(`getExtension`)
        .returns({ extensionKind: proxyExtensionKind.Workspace });
      mockCommands
        .expects(`executeCommand`)
        .withExactArgs(
          `setContext`,
          `ext.runPlatform`,
          ExtensionRunMode.basWorkspace
        )
        .resolves();
      expect(shouldRunCtlServer()).to.be.true;
    });

    it("shouldRunCtlServer, running in BAS, extensionKind === 'UI'", () => {
      sandbox.stub(process, `env`).value({ WS_BASE_URL: landscape });
      sandbox.stub(proxyEnv, `remoteName`).value(landscape);
      mockExtension
        .expects(`getExtension`)
        .returns({ extensionKind: proxyExtensionKind.UI });
      mockCommands
        .expects(`executeCommand`)
        .withExactArgs(`setContext`, `ext.runPlatform`, ExtensionRunMode.basUi)
        .resolves();
      expect(shouldRunCtlServer()).to.be.false;
    });

    it("shouldRunCtlServer, running in BAS, extension undefined", () => {
      sandbox.stub(process, `env`).value({ WS_BASE_URL: landscape });
      sandbox.stub(proxyEnv, `remoteName`).value(landscape);
      mockExtension.expects(`getExtension`).returns(undefined);
      mockCommands
        .expects(`executeCommand`)
        .withExactArgs(
          `setContext`,
          `ext.runPlatform`,
          ExtensionRunMode.unexpected
        )
        .resolves();
      expect(shouldRunCtlServer()).to.be.false;
    });

    it("shouldRunCtlServer, running locally through WSL, extension undefined", () => {
      sandbox.stub(process, `env`).value({});
      sandbox.stub(proxyEnv, `remoteName`).value("wsl");
      mockCommands
        .expects(`executeCommand`)
        .withExactArgs(`setContext`, `ext.runPlatform`, ExtensionRunMode.wsl)
        .resolves();
      expect(shouldRunCtlServer()).to.be.false;
    });

    it("shouldRunCtlServer, running locally through SSH, extension undefined", () => {
      sandbox.stub(process, `env`).value({});
      sandbox.stub(proxyEnv, `remoteName`).value("ssh-remote");
      mockCommands
        .expects(`executeCommand`)
        .withExactArgs(
          `setContext`,
          `ext.runPlatform`,
          ExtensionRunMode.unexpected
        )
        .resolves();
      expect(shouldRunCtlServer()).to.be.false;
    });
  });
});
