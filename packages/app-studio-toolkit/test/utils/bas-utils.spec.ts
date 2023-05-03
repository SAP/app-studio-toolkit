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
import { ExtensionRunMode, isRunInBAS } from "../../src/utils/bas-utils";

describe("bas-utils unit test", () => {
  let sandbox: SinonSandbox;
  let mockExtension: SinonMock;
  let mockCommands: SinonMock;
  let workspaceConfigurationSinonMock: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    mockExtension = sandbox.mock(proxyExtension);
    mockCommands = sandbox.mock(proxyCommands);
    workspaceConfigurationSinonMock = sandbox.mock(workspaceConfigurationMock);
  });

  afterEach(() => {
    mockExtension.verify();
    mockCommands.verify();
    workspaceConfigurationSinonMock.verify();
  });

  const landscape = `https://my-landscape.test.com`;

  describe("isRunInBAS scope", () => {
    it("isRunInBAS, running locally, process.env.WS_BASE_URL is undefined", () => {
      sandbox.stub(process, `env`).value({});
      mockCommands
        .expects(`executeCommand`)
        .withExactArgs(
          `setContext`,
          `ext.runPlatform`,
          ExtensionRunMode.desktop
        )
        .resolves();
      expect(isRunInBAS()).to.be.false;
    });

    it("isRunInBAS, running through ssh-remote, process.env.WS_BASE_URL is defined", () => {
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
      workspaceConfigurationSinonMock
        .expects("update")
        .withExactArgs("workbench.startupEditor", "none", 1)
        .resolves();
      expect(isRunInBAS()).to.be.false;
    });

    it("isRunInBAS, running in BAS, extensionKind === 'Workspace'", () => {
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
      expect(isRunInBAS()).to.be.true;
    });

    it("isRunInBAS, running in BAS, extensionKind === 'UI'", () => {
      sandbox.stub(process, `env`).value({ WS_BASE_URL: landscape });
      sandbox.stub(proxyEnv, `remoteName`).value(landscape);
      mockExtension
        .expects(`getExtension`)
        .returns({ extensionKind: proxyExtensionKind.UI });
      mockCommands
        .expects(`executeCommand`)
        .withExactArgs(`setContext`, `ext.runPlatform`, ExtensionRunMode.basUi)
        .resolves();
      expect(isRunInBAS()).to.be.false;
    });

    it("isRunInBAS, running in BAS, extension undefined", () => {
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
      expect(isRunInBAS()).to.be.false;
    });
  });
});
