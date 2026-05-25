import { expect } from "chai";
import { mockVscode } from "../../test/mockUtil";
import { SinonSandbox, SinonMock, createSandbox, stub } from "sinon";

enum ConfigurationTargetProxy {
  Global = 1,
}

let registry: Map<string, () => void>;

const vscodeProxy = {
  workspace: {
    getConfiguration: () => {
      return {
        get: stub().returns(undefined),
        update: stub().resolves(),
      };
    },
    onDidChangeWorkspaceFolders: () => {},
    onDidChangeSessions: () => {},
  },
  commands: {
    registerCommand: (command: string, handler: () => void) => {
      registry.set(command, handler);
    },
    executeCommand: (...args: any) => {},
  },
  window: {
    createTreeView: () => {},
    registerUriHandler: () => {},
  },
  TreeItem: class MockTreeItem {
    public readonly label: string;
    constructor(label?: string) {
      this.label = label || "";
    }
  },
  Disposable: {
    dispose: () => {},
  },
  ConfigurationTarget: ConfigurationTargetProxy,
  authentication: {
    getSession: () => {},
    registerAuthenticationProvider: () => {},
    onDidChangeSessions: () => {},
  },
  EventEmitter: class EventEmitterMock {
    fire: () => void = stub().returns(void 0);
    constructor() {}
  },
};

mockVscode(vscodeProxy, "dist/src/authentication/authProvider.js");
mockVscode(vscodeProxy, "dist/src/devspace-manager/devspace/connect.js");
mockVscode(vscodeProxy, "dist/src/devspace-manager/landscape/landscape.js");
mockVscode(vscodeProxy, "dist/src/devspace-manager/instance.js");

import * as instance from "../../src/devspace-manager/instance";
import { BasRemoteAuthenticationProvider } from "../../src/authentication/authProvider";
import { xor } from "lodash";

describe("extension unit test", () => {
  let sandbox: SinonSandbox;
  let authenticationMock: SinonMock;
  let commandsMock: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    registry = new Map<string, () => void>();
    authenticationMock = sandbox.mock(vscodeProxy.authentication);
    commandsMock = sandbox.mock(vscodeProxy.commands);
  });

  afterEach(() => {
    authenticationMock.verify();
    commandsMock.verify();
  });

  const context: any = {
    subscriptions: {
      push: () => {},
    },
  };

  describe("initBasRemoteExplorer", () => {
    it("verifying registered commands", () => {
      instance.initBasRemoteExplorer(context);
      expect(
        xor(
          [...registry.keys()],
          [
            `local-extension.tree.settings`,
            `local-extension.tree.refresh`,
            `local-extension.dev-space.connect-new-window`,
            `local-extension.dev-space.open-in-bas`,
            `local-extension.dev-space.start`,
            `local-extension.dev-space.stop`,
            `local-extension.dev-space.delete`,
            `local-extension.dev-space.add`,
            `local-extension.dev-space.edit`,
            `local-extension.dev-space.copy-ws-id`,
            `local-extension.landscape.open-dev-space-manager`,
            `local-extension.landscape.add`,
            `local-extension.landscape.delete`,
            `local-extension.landscape.set`,
            `local-extension.login`,
            `local-extension.dev-space.open-in-code`,
            `app-studio-toolkit.devspace-manager.landscape.default-on`,
            `app-studio-toolkit.devspace-manager.landscape.default-off`,
            `app-studio-toolkit.devspace-manager.get-default-landscape`,
          ]
        )
      ).to.be.empty;
    });

    it("authentication provider registered", () => {
      authenticationMock
        .expects(`registerAuthenticationProvider`)
        .withArgs(
          BasRemoteAuthenticationProvider.id,
          "SAP Business Application Studio"
        )
        .returns({});
      authenticationMock.expects(`onDidChangeSessions`).returns({});
      instance.initBasRemoteExplorer(context);
    });

    it("command `app-studio-toolkit.devspace-manager.landscape.default-off`", async () => {
      commandsMock
        .expects(`executeCommand`)
        .withExactArgs(`local-extension.tree.refresh`)
        .resolves();
      instance.initBasRemoteExplorer(context);
      expect(
        // eslint-disable-next-line @typescript-eslint/await-thenable -- ignore
        await registry.get(
          `app-studio-toolkit.devspace-manager.landscape.default-off`
        )!()
      ).be.undefined;
    });

    it("command `app-studio-toolkit.devspace-manager.get-default-landscape`", () => {
      instance.initBasRemoteExplorer(context);
      expect(
        registry.get(
          `app-studio-toolkit.devspace-manager.get-default-landscape`
        )!()
      ).be.empty;
    });

    it("command `local-extension.tree.refresh`", () => {
      instance.initBasRemoteExplorer(context);
      expect(registry.get(`local-extension.tree.refresh`)!()).be.undefined;
    });

    it("command `local-extension.tree.settings`", () => {
      commandsMock
        .expects(`executeCommand`)
        .withExactArgs(`workbench.action.openSettings`, `sap-remote`)
        .returns({});
      instance.initBasRemoteExplorer(context);
      registry.get(`local-extension.tree.settings`)?.();
    });

    it("authentication.onDidChangeSessions registered", () => {
      const onDidChangeSessionsStub = sandbox.stub();
      vscodeProxy.authentication.onDidChangeSessions = onDidChangeSessionsStub;
      instance.initBasRemoteExplorer(context);
      expect(onDidChangeSessionsStub.calledOnce).to.be.true;
    });

    it("authentication.onDidChangeSessions callback", async () => {
      const onDidChangeSessionsStub = sandbox.stub();
      vscodeProxy.authentication.onDidChangeSessions = onDidChangeSessionsStub;
      instance.initBasRemoteExplorer(context);

      const callback = onDidChangeSessionsStub.getCall(0).args[0];
      expect(callback).to.be.a("function");

      // Simulate session change
      authenticationMock
        .expects(`getSession`)
        .withExactArgs(BasRemoteAuthenticationProvider.id, [], { silent: true })
        .resolves();
      const sessionChangeEvent = {
        provider: { id: BasRemoteAuthenticationProvider.id },
      };
      commandsMock
        .expects(`executeCommand`)
        .withExactArgs(`remote-access.close-tunnel`)
        .resolves();
      callback(sessionChangeEvent);
      await new Promise((resolve) => setTimeout(resolve, 200)); // wait for actions to be performed
    });

    it("authentication.onDidChangeSessions callback with unexpected provider", () => {
      const onDidChangeSessionsStub = sandbox.stub();
      vscodeProxy.authentication.onDidChangeSessions = onDidChangeSessionsStub;
      instance.initBasRemoteExplorer(context);

      const callback = onDidChangeSessionsStub.getCall(0).args[0];
      expect(callback).to.be.a("function");

      // Simulate session change
      const sessionChangeEvent = { provider: { id: "id" } };
      commandsMock
        .expects(`executeCommand`)
        .withExactArgs(`remote-access.close-tunnel`)
        .never();
      callback(sessionChangeEvent);
    });

    it("authentication.onDidChangeSessions callback - some session exists (not fully logged out)", () => {
      const onDidChangeSessionsStub = sandbox.stub();
      vscodeProxy.authentication.onDidChangeSessions = onDidChangeSessionsStub;
      instance.initBasRemoteExplorer(context);

      const callback = onDidChangeSessionsStub.getCall(0).args[0];
      expect(callback).to.be.a("function");

      // Simulate session change
      authenticationMock
        .expects(`getSession`)
        .withExactArgs(BasRemoteAuthenticationProvider.id, [], { silent: true })
        .resolves({});
      const sessionChangeEvent = {
        provider: { id: BasRemoteAuthenticationProvider.id },
      };
      commandsMock
        .expects(`executeCommand`)
        .withExactArgs(`remote-access.close-tunnel`)
        .never();
      callback(sessionChangeEvent);
    });
  });

  it("deactivate", async () => {
    commandsMock
      .expects(`executeCommand`)
      .withExactArgs(`remote-access.close-tunnel`)
      .resolves();
    await instance.deactivateBasRemoteExplorer();
  });
});
