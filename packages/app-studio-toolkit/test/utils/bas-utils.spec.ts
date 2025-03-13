import { mockVscode } from "../mockUtil";
import { expect } from "chai";
import {
  SinonSandbox,
  SinonMock,
  createSandbox,
  SinonFakeTimers,
  useFakeTimers,
} from "sinon";
import { devspace } from "@sap/bas-sdk";

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

const proxyWorkspaceFs = {
  writeFile: () => Promise.resolve(),
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
    fs: proxyWorkspaceFs,
  },
  Uri: {
    file: () => "",
  },
  window: {
    withProgress: () => "",
  },
  ProgressLocation: { Notification: 15 },
};

mockVscode(testVscode, "dist/src/utils/bas-utils.js");
import {
  cleanKeepAliveInterval,
  ExtensionRunMode,
  getExtensionRunPlatform,
  shouldRunCtlServer,
  startBasKeepAlive,
  internal,
} from "../../src/utils/bas-utils";

describe("bas-utils unit test", function () {
  let sandbox: SinonSandbox;
  let mockExtension: SinonMock;
  let mockCommands: SinonMock;
  let mockWorkspaceFs: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    mockExtension = sandbox.mock(proxyExtension);
    mockCommands = sandbox.mock(proxyCommands);
    mockWorkspaceFs = sandbox.mock(proxyWorkspaceFs);
  });

  afterEach(() => {
    mockExtension.verify();
    mockCommands.verify();
    mockWorkspaceFs.verify();
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

  describe("getExtensionRunPlatform scope", () => {
    it("getExtensionRunPlatform, extensionId provided", () => {
      const extensionId = `testExtensionId`;

      sandbox.stub(process, `env`).value({ WS_BASE_URL: landscape });
      sandbox.stub(proxyEnv, `remoteName`).value(landscape);
      mockExtension
        .expects(`getExtension`)
        .returns({ extensionKind: proxyExtensionKind.UI })
        .calledWith(extensionId);
      expect(getExtensionRunPlatform(extensionId)).to.equal(
        ExtensionRunMode.basUi
      );
    });

    it("getExtensionRunPlatform, running in WSL", () => {
      sandbox.stub(process, `env`).value({});
      sandbox.stub(proxyEnv, `remoteName`).value("wsl");
      expect(getExtensionRunPlatform()).to.equal(ExtensionRunMode.wsl);
    });

    it("getExtensionRunPlatform, running locally", () => {
      sandbox.stub(process, `env`).value({});
      sandbox.stub(proxyEnv, `remoteName`).value(undefined);
      expect(getExtensionRunPlatform()).to.equal(ExtensionRunMode.desktop);
    });
  });

  describe("startBasKeepAlive", () => {
    beforeEach(() => {
      sandbox.stub(testVscode.Uri, `file`).resolves("test");
      sandbox.stub(process, "env").value({ WS_BASE_URL: landscape });
    });

    afterEach(() => {
      cleanKeepAliveInterval();
    });

    it("should not start if not in basRemote mode", () => {
      sandbox.stub(testVscode.env, "remoteName").value(undefined);
      mockWorkspaceFs.expects(`writeFile`).never();
      startBasKeepAlive();
    });

    it("should start if in basRemote mode", () => {
      sandbox.stub(testVscode.env, "remoteName").value("ssh-remote");
      mockWorkspaceFs.expects(`writeFile`).once().resolves();

      startBasKeepAlive();
    });

    it("should clear existing interval before starting a new one", () => {
      sandbox.stub(testVscode.env, "remoteName").value("ssh-remote");
      const clearIntervalSpy = sandbox.spy(global, "clearInterval");
      mockWorkspaceFs.expects(`writeFile`).twice().resolves();

      startBasKeepAlive();
      startBasKeepAlive();

      expect(clearIntervalSpy.called).to.be.true;
    });

    it("should handle errors in touchFile", () => {
      sandbox.stub(testVscode.env, "remoteName").value("ssh-remote");
      mockWorkspaceFs
        .expects(`writeFile`)
        .once()
        .rejects(new Error("Test error"));

      startBasKeepAlive();
    });
  });

  describe("internal functions", () => {
    let clock: SinonFakeTimers;

    beforeEach(() => {
      clock = useFakeTimers();
    });

    afterEach(() => {
      clock.restore();
    });

    it("formatTimeRemaining should format time correctly", () => {
      expect(internal.formatTimeRemaining(90)).to.equal("1:30");
      expect(internal.formatTimeRemaining(60)).to.equal("1:00");
      expect(internal.formatTimeRemaining(59)).to.equal("0:59");
    });

    it("askToSessionExtend should resolve true on cancellation", async () => {
      const progressStub = sandbox
        .stub(testVscode.window, "withProgress")
        .callsFake(((options: any, task: any) => {
          const token = {
            onCancellationRequested: (callback: () => void) => callback(),
          };
          return task({ report: () => {} }, token) as Promise<boolean>;
        }) as any);

      const result = await internal.askToSessionExtend();
      expect(result).to.be.true;
      expect(progressStub.calledOnce).to.be.true;
    });
  });
});
