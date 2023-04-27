import { expect } from "chai";
import { SinonMock, SinonSandbox, createSandbox, mock } from "sinon";
import { BasRemoteAuthenticationProvider } from "../../src/authentication/authProvider";
import { fail } from "assert";
import proxyquire from "proxyquire";
import { messages } from "../../src/devspace-manager/common/messages";
import type {
  AuthenticationSessionsChangeEvent,
  SecretStorage,
  SecretStorageChangeEvent,
} from "vscode";
import { cloneDeep } from "lodash";

describe("authProvider unit test", () => {
  let authListeners: ((e: AuthenticationSessionsChangeEvent) => any)[] = [];
  const vscodeProxy = {
    authentication: {
      getSession: () => {
        throw new Error(`not implemented`);
      },
      onDidChangeSessions: (
        l: (e: AuthenticationSessionsChangeEvent) => any
      ) => {
        authListeners.push(l);
      },
    },
    commands: {
      executeCommand: (m: string) => {
        throw new Error(`not implemented`);
      },
    },
    Disposable: class proxyDispposable {
      constructor() {}
      dispose() {}
      static from() {
        return new proxyDispposable();
      }
    },
    EventEmitter: class proxyEventEmitter {
      constructor() {}
      fire() {}
    },
  };

  const proxyAuthUtils = {
    retrieveJwt: () => {
      throw new Error(`not implemented`);
    },
  };

  let storageListeners: ((e: SecretStorageChangeEvent) => any)[] = [];
  const proxySecretSorage: SecretStorage = {
    get: () => {
      throw new Error(`not implemented`);
    },
    store: () => {
      throw new Error(`not implemented`);
    },
    delete: () => {
      throw new Error(`not implemented`);
    },
    onDidChange: (l): any => {
      storageListeners.push(l);
    },
  };

  let mockStorage: SinonMock;
  let BasRemoteAuthenticationProviderProxy: typeof BasRemoteAuthenticationProvider;
  let sandbox: SinonSandbox;

  before(() => {
    sandbox = createSandbox();
    BasRemoteAuthenticationProviderProxy = proxyquire(
      "../../src/authentication/authProvider",
      {
        vscode: {
          commands: vscodeProxy.commands,
          authentication: vscodeProxy.authentication,
          Disposable: vscodeProxy.Disposable,
          EventEmitter: vscodeProxy.EventEmitter,
          "@noCallThru": true,
        },
        "./auth-utils": proxyAuthUtils,
      }
    ).BasRemoteAuthenticationProvider;
  });

  beforeEach(() => {
    mockStorage = mock(proxySecretSorage);
  });

  afterEach(() => {
    mockStorage.verify();
    sandbox.restore();
    authListeners = [];
    storageListeners = [];
  });

  const landscape1 = `https://my.landscape-1.com`;
  const landscape2 = `https://my.landscape-2.com`;
  const objToken: any = {};
  objToken[landscape1] = `token-1`;
  objToken[landscape2] = `token-2`;
  const secretKey: string = "baslandscapepat";
  const dummyToken = `dummy-token`;

  describe("getSessions method", () => {
    it("getSessions, scope not defined, storage empty", async () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      mockStorage
        .expects(`get`)
        .withExactArgs(secretKey)
        .twice()
        .resolves(undefined);
      expect(await instance.getSessions()).to.be.deep.equal([]);
    });

    it("getSessions, scope not defined, storage exist", async () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      mockStorage
        .expects(`get`)
        .withExactArgs(secretKey)
        .twice()
        .resolves(`{}`);
      expect(await instance.getSessions()).to.be.deep.equal([
        {
          account: {
            id: BasRemoteAuthenticationProviderProxy.id,
            label: "BAS Access Token",
          },
          id: BasRemoteAuthenticationProviderProxy.id,
          scopes: [],
          accessToken: dummyToken,
        },
      ]);
    });

    it("getSessions, scope defined, storage exist", async () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      mockStorage
        .expects(`get`)
        .withExactArgs(secretKey)
        .twice()
        .resolves(JSON.stringify(objToken));
      expect(await instance.getSessions([landscape1])).to.be.deep.equal([
        {
          account: {
            id: BasRemoteAuthenticationProviderProxy.id,
            label: "BAS Access Token",
          },
          id: BasRemoteAuthenticationProviderProxy.id,
          scopes: [landscape1],
          accessToken: objToken[landscape1],
        },
      ]);
    });
  });

  describe("createSession method", () => {
    let mockAuthUtils: SinonMock;
    beforeEach(() => {
      mockAuthUtils = mock(proxyAuthUtils);
    });

    afterEach(() => {
      mockAuthUtils.verify();
    });

    it("createSession, scope defined, storage empty, retrieveJwt succedded", async () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      mockStorage
        .expects(`get`)
        .withExactArgs(secretKey)
        .twice()
        .resolves(undefined);
      mockAuthUtils
        .expects(`retrieveJwt`)
        .withExactArgs(landscape2)
        .resolves(objToken[landscape2]);
      const landscapeToken: any = {};
      landscapeToken[landscape2] = objToken[landscape2];
      mockStorage
        .expects(`store`)
        .withExactArgs(
          secretKey,
          JSON.stringify(Object.assign({}, landscapeToken))
        )
        .resolves();
      expect(await instance[`createSession`]([landscape2])).to.be.deep.equal({
        account: {
          id: BasRemoteAuthenticationProviderProxy.id,
          label: "BAS Access Token",
        },
        id: BasRemoteAuthenticationProviderProxy.id,
        scopes: [landscape2],
        accessToken: objToken[landscape2],
      });
    });

    it("createSession, scope defined, storage exists, retrieveJwt succedded", async () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      mockStorage
        .expects(`get`)
        .withExactArgs(secretKey)
        .twice()
        .resolves(JSON.stringify(objToken));
      mockAuthUtils
        .expects(`retrieveJwt`)
        .withExactArgs(landscape2)
        .resolves(objToken[landscape2]);
      const landscapeToken: any = {};
      landscapeToken[landscape2] = objToken[landscape2];
      mockStorage
        .expects(`store`)
        .withExactArgs(
          secretKey,
          JSON.stringify(Object.assign(objToken, landscapeToken))
        )
        .resolves();
      expect(await instance[`createSession`]([landscape2])).to.be.deep.equal({
        account: {
          id: BasRemoteAuthenticationProviderProxy.id,
          label: "BAS Access Token",
        },
        id: BasRemoteAuthenticationProviderProxy.id,
        scopes: [landscape2],
        accessToken: objToken[landscape2],
      });
    });

    it("createSession, scope defined, storage added, retrieveJwt succedded", async () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      const previousToken = cloneDeep(objToken);
      delete previousToken[landscape2];
      mockStorage
        .expects(`get`)
        .withExactArgs(secretKey)
        .twice()
        .resolves(JSON.stringify(previousToken));
      mockAuthUtils
        .expects(`retrieveJwt`)
        .withExactArgs(landscape2)
        .resolves(objToken[landscape2]);
      const landscapeToken: any = {};
      landscapeToken[landscape2] = objToken[landscape2];
      mockStorage
        .expects(`store`)
        .withExactArgs(
          secretKey,
          JSON.stringify(Object.assign(previousToken, landscapeToken))
        )
        .resolves();
      expect(await instance[`createSession`]([landscape2])).to.be.deep.equal({
        account: {
          id: BasRemoteAuthenticationProviderProxy.id,
          label: "BAS Access Token",
        },
        id: BasRemoteAuthenticationProviderProxy.id,
        scopes: [landscape2],
        accessToken: objToken[landscape2],
      });
    });

    it("createSession, scope defined, storage empty, retrieveJwt failure", async () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      mockStorage.expects(`get`).withExactArgs(secretKey).resolves(undefined);
      mockAuthUtils.expects(`retrieveJwt`).withExactArgs(landscape2).resolves();
      try {
        await instance[`createSession`]([landscape2]);
        fail(`should fail`);
      } catch (e) {
        expect(e.message).to.be.equal(messages.err_get_jwt_required);
      }
    });
  });

  describe("removeSession method", () => {
    it("removeSession, succedded", async () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      mockStorage.expects(`get`).withExactArgs(secretKey).resolves(undefined);
      mockStorage
        .expects(`delete`)
        .withExactArgs(secretKey)
        .resolves(undefined);
      await instance[`removeSession`](`sessionId`);
    });
  });

  describe("getTokenByScope method", () => {
    it("getTokenByScope, objToken empty, scope empty", () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      expect(instance[`getTokenByScope`](``, [])).to.be.undefined;
    });

    it("getTokenByScope, objToken undefined, scope empty", () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      expect(instance[`getTokenByScope`](undefined, [])).to.be.undefined;
    });

    it("getTokenByScope, objToken empty object, scope empty", () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      expect(instance[`getTokenByScope`](`{}`, [])).to.be.equal(dummyToken);
    });

    it("getTokenByScope, objToken empty object, scope specified", () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      expect(instance[`getTokenByScope`](`{}`, [landscape2])).to.be.undefined;
    });

    it("getTokenByScope, objToken provided, scope specified", () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      expect(
        instance[`getTokenByScope`](JSON.stringify(objToken), [landscape2])
      ).to.be.equal(objToken[landscape2]);
    });

    it("getTokenByScope, objToken provided, not existed scope specified", () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      expect(
        instance[`getTokenByScope`](JSON.stringify(objToken), [
          `not-existing-scope`,
        ])
      ).to.be.undefined;
    });
  });

  describe("checkForUpdates method", () => {
    const proxyEmitter: any = {
      fire: () => {
        throw new Error(`not implemented`);
      },
    };

    it("checkForUpdates, scope undefined, no changes", async () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      mockStorage
        .expects(`get`)
        .withExactArgs(secretKey)
        .twice()
        .resolves(undefined);
      expect(await instance[`checkForUpdates`]([])).to.be.undefined;
    });

    it("checkForUpdates, scope empty, no changes", async () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      mockStorage
        .expects(`get`)
        .withExactArgs(secretKey)
        .twice()
        .resolves(`{}`);
      instance[`currentToken`] = Promise.resolve(`{}`);
      expect(await instance[`checkForUpdates`]([])).to.be.undefined;
    });

    it("checkForUpdates, scope empty, added common scope", async () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      mockStorage
        .expects(`get`)
        .withExactArgs(secretKey)
        .thrice()
        .resolves(`{}`);
      instance[`currentToken`] = Promise.resolve(undefined);
      instance[`_onDidChangeSessions`] = proxyEmitter;
      const stubEmitter = sandbox.stub(proxyEmitter, `fire`);
      expect(await instance[`checkForUpdates`]([])).to.be.undefined;
      const args = stubEmitter.args[0][0];
      expect(args.added.length).to.be.equal(1);
      expect(args.added[0].accessToken).to.be.equal(dummyToken);
      expect(args.removed.length).to.be.equal(0);
      expect(args.changed.length).to.be.equal(0);
    });

    it("checkForUpdates, scope undefined, remove common scope", async () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      mockStorage
        .expects(`get`)
        .withExactArgs(secretKey)
        .thrice()
        .resolves(undefined);
      instance[`currentToken`] = Promise.resolve(`{}`);
      instance[`_onDidChangeSessions`] = proxyEmitter;
      const stubEmitter = sandbox.stub(proxyEmitter, `fire`);
      expect(await instance[`checkForUpdates`]([])).to.be.undefined;
      const args = stubEmitter.args[0][0];
      expect(args.added.length).to.be.equal(0);
      expect(args.removed.length).to.be.equal(1);
      expect(args.removed[0].accessToken).to.be.equal(dummyToken);
      expect(args.changed.length).to.be.equal(0);
    });

    it("checkForUpdates, scope specified, added scope", async () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      const landscapeToken = cloneDeep(objToken);
      delete landscapeToken[landscape2];
      mockStorage
        .expects(`get`)
        .withExactArgs(secretKey)
        .thrice()
        .resolves(JSON.stringify(landscapeToken));
      instance[`currentToken`] = Promise.resolve(`{}`);
      instance[`_onDidChangeSessions`] = proxyEmitter;
      const stubEmitter = sandbox.stub(proxyEmitter, `fire`);
      expect(await instance[`checkForUpdates`]([landscape1])).to.be.undefined;
      const args = stubEmitter.args[0][0];
      expect(args.added.length).to.be.equal(1);
      expect(args.added[0].accessToken).to.be.equal(landscapeToken[landscape1]);
      expect(args.removed.length).to.be.equal(0);
      expect(args.changed.length).to.be.equal(0);
    });

    it("checkForUpdates, scope exists, remove scope", async () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      const landscapeToken = cloneDeep(objToken);
      delete landscapeToken[landscape2];
      mockStorage
        .expects(`get`)
        .withExactArgs(secretKey)
        .thrice()
        .resolves(JSON.stringify(landscapeToken));
      instance[`currentToken`] = Promise.resolve(JSON.stringify(objToken));
      instance[`_onDidChangeSessions`] = proxyEmitter;
      const stubEmitter = sandbox.stub(proxyEmitter, `fire`);
      expect(await instance[`checkForUpdates`]([landscape2])).to.be.undefined;
      const args = stubEmitter.args[0][0];
      expect(args.added.length).to.be.equal(0);
      expect(args.removed.length).to.be.equal(1);
      expect(args.removed[0].accessToken).to.be.equal(objToken[landscape2]);
      expect(args.changed.length).to.be.equal(0);
    });

    it("checkForUpdates, scope exists, changed scope", async () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      const landscapeToken = cloneDeep(objToken);
      landscapeToken[landscape2] = "token-updated";
      mockStorage
        .expects(`get`)
        .withExactArgs(secretKey)
        .thrice()
        .resolves(JSON.stringify(landscapeToken));
      instance[`currentToken`] = Promise.resolve(JSON.stringify(objToken));
      instance[`_onDidChangeSessions`] = proxyEmitter;
      const stubEmitter = sandbox.stub(proxyEmitter, `fire`);
      expect(await instance[`checkForUpdates`]([landscape2])).to.be.undefined;
      const args = stubEmitter.args[0][0];
      expect(args.added.length).to.be.equal(0);
      expect(args.removed.length).to.be.equal(0);
      expect(args.changed.length).to.be.equal(1);
      expect(args.changed[0].accessToken).to.be.equal(
        landscapeToken[landscape2]
      );
    });
  });

  describe("dispose method", () => {
    it("dispose, not initialized", () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      expect(instance.dispose()).to.be.undefined;
    });

    it("dispose, initialized", () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      mockStorage.expects(`get`).withExactArgs(secretKey).resolves(undefined);
      instance[`ensureInitialized`]([]);
      expect(instance.dispose()).to.be.undefined;
    });
  });

  describe("ensureInitialized method", () => {
    let mockCommands: SinonMock;

    beforeEach(() => {
      mockCommands = mock(vscodeProxy.commands);
    });

    afterEach(() => {
      mockCommands.verify();
    });

    it("ensureInitialized, already initialized", () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      mockStorage.expects(`get`).withExactArgs(secretKey).resolves(undefined);
      instance[`ensureInitialized`]([]);
      instance[`ensureInitialized`]([]);
    });

    it("onDidChange triggered with correct secret key", () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      const spyCheckup = sandbox
        .stub(instance, <any>`checkForUpdates`)
        .resolves();
      mockStorage.expects(`get`).withExactArgs(secretKey).resolves(undefined);
      instance[`ensureInitialized`]([landscape1]);
      storageListeners[0]({ key: secretKey });
      expect(spyCheckup.called).to.be.true;
      expect(spyCheckup.args[0][0]).to.be.deep.equal([landscape1]);
    });

    it("onDidChange triggered with incorrect secret key", () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      const spyCheckup = sandbox
        .stub(instance, <any>`checkForUpdates`)
        .resolves();
      mockStorage.expects(`get`).withExactArgs(secretKey).resolves(undefined);
      instance[`ensureInitialized`]([landscape1]);
      storageListeners[0]({ key: `key` });
      expect(spyCheckup.called).to.be.false;
    });

    it("onDidChangeSessions triggered with correct provider id", async () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      mockCommands
        .expects(`executeCommand`)
        .withExactArgs(`local-extension.tree.refresh`)
        .resolves();
      const spyCheckup = sandbox
        .stub(instance, <any>`checkForUpdates`)
        .resolves();
      mockStorage.expects(`get`).withExactArgs(secretKey).resolves(undefined);
      instance[`ensureInitialized`]([landscape2]);
      authListeners[0]({
        provider: { id: BasRemoteAuthenticationProvider.id, label: `label` },
      });
      await new Promise((resolve) => setTimeout(() => resolve(true), 1000));
      expect(spyCheckup.called).to.be.true;
      expect(spyCheckup.args[0][0]).to.be.deep.equal([landscape2]);
    });

    it("onDidChangeSessions triggered with incorrect provider id", () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      const spyCheckup = sandbox
        .stub(instance, <any>`checkForUpdates`)
        .resolves();
      mockStorage.expects(`get`).withExactArgs(secretKey).resolves(undefined);
      instance[`ensureInitialized`]([landscape2]);
      authListeners[0]({ provider: { id: `incorrect-id`, label: `label` } });
      expect(spyCheckup.called).to.be.false;
    });

    it("onDidChangeSessions, get event", () => {
      const instance = new BasRemoteAuthenticationProviderProxy(
        proxySecretSorage
      );
      expect(instance.onDidChangeSessions).to.be.deep.equal(
        instance[`_onDidChangeSessions`].event
      );
    });
  });
});
