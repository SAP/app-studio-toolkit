import { expect } from "chai";
import { SinonMock, mock, stub } from "sinon";
import { mockVscode } from "../mockUtil";

const vscodeProxy = {
  authentication: {
    getSession: () => {
      throw new Error(`not implemented`);
    },
  },
  env: {
    openExternal: () => {
      throw new Error(`not implemented`);
    },
  },
  Uri: {
    parse: () => {
      throw new Error(`not implemented`);
    },
  },
  window: {
    showErrorMessage: (m: string) => {
      throw new Error(`not implemented`);
    },
  },
  commands: {
    executeCommand: () => {
      throw new Error(`not implemented`);
    },
  },
  EventEmitter: class ProxyEventEmitter<T> {
    constructor() {}
    fire() {
      throw new Error("not implemented");
    }
  },
};

mockVscode(vscodeProxy, "dist/src/devspace-manager/handler/basHandler.js");

import * as auth from "../../src/authentication/auth-utils";
import { BasRemoteAuthenticationProvider } from "../../src/authentication/authProvider";
import { fail } from "assert";
import proxyquire from "proxyquire";
import { messages } from "../../src/devspace-manager/common/messages";

describe("auth-utils unit test", () => {
  let mockWindow: SinonMock;
  let mockUri: SinonMock;
  let mockAuth: SinonMock;
  let mockOs: SinonMock;
  let mockEnv: SinonMock;
  let authUtilsProxy: typeof auth;
  let handlerProxy: any;

  let extLoginListener: ((req: any, res: any) => void) | undefined;
  let cbOnServerError: ((e: Error) => void) | undefined;
  const server = {
    on: (path: string, listener: () => void) => {
      if (path === `error`) {
        cbOnServerError = listener;
      }
    },
  };
  const appProxy = {
    use: () => {},
    options: () => {},
    post: (path: string, listener: (req: any, res: any) => void) => {
      if (path === `/ext-login`) {
        extLoginListener = listener;
      }
    },
    listen: (port: number, cb: () => void) => {
      expect(port).to.be.equal(55532);
      return server;
    },
  };
  const expressProxy = () => appProxy;

  const listenerProxy = {
    dispose: () => {},
  };
  const proxyEmitter = {
    event: (handler: any) => {
      handlerProxy = handler;
      return listenerProxy;
    },
    fire: (event: any) => {
      handlerProxy(event);
    },
  };

  const proxyOs = {
    platform: () => {
      throw new Error("not implemented");
    },
  };

  before(() => {
    const basHandlerModule = proxyquire(
      "../../src/devspace-manager/handler/basHandler",
      {
        vscode: {
          Uri: vscodeProxy.Uri,
          window: vscodeProxy.window,
          commands: vscodeProxy.commands,
          EventEmitter: vscodeProxy.EventEmitter,
          "@noCallThru": true,
        },
      }
    );
    basHandlerModule.eventEmitter = proxyEmitter;
    authUtilsProxy = proxyquire("../../src/authentication/auth-utils", {
      vscode: {
        window: vscodeProxy.window,
        authentication: vscodeProxy.authentication,
        env: vscodeProxy.env,
        Uri: vscodeProxy.Uri,
        "@noCallThru": true,
      },
      os: proxyOs,
      express: expressProxy,
      "../../src/devspace-manager/handler/basHandler": basHandlerModule,
    });
  });

  beforeEach(() => {
    extLoginListener = undefined;
    cbOnServerError = undefined;
    mockWindow = mock(vscodeProxy.window);
    mockUri = mock(vscodeProxy.Uri);
    mockAuth = mock(vscodeProxy.authentication);
    mockEnv = mock(vscodeProxy.env);
    mockOs = mock(proxyOs);
  });

  afterEach(() => {
    mockWindow.verify();
    mockUri.verify();
    mockAuth.verify();
    mockEnv.verify();
    mockOs.verify();
  });

  const landscape = `https://my.landscape-1.com`;
  const dummyToken =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmb28iOiJiYXIiLCJleHAiOjEzOTMyODY4OTMsImlhdCI6MTM5MzI2ODg5M30.4-iaDojEVl0pJQMjrbM1EzUIfAZgsbK_kgnVyVxFSVo";

  it("getJwt, exists", async () => {
    const session = { accessToken: `token` };
    mockAuth
      .expects(`getSession`)
      .withExactArgs(BasRemoteAuthenticationProvider.id, [landscape])
      .resolves(session);
    expect(await authUtilsProxy.getJwt(landscape)).to.be.equal(
      session.accessToken
    );
  });

  it("getJwt, not exists", async () => {
    mockAuth
      .expects(`getSession`)
      .withExactArgs(BasRemoteAuthenticationProvider.id, [landscape])
      .resolves();
    try {
      await authUtilsProxy.getJwt(landscape);
      fail(`should fail`);
    } catch (e) {
      expect(e.message).to.equal(messages.err_get_jwt_not_exists);
    }
  });

  it("hasJwt, session exists, expired", async () => {
    const session = {
      accessToken: dummyToken,
    };
    mockAuth
      .expects(`getSession`)
      .withExactArgs(BasRemoteAuthenticationProvider.id, [landscape])
      .resolves(session);
    expect(await authUtilsProxy.hasJwt(landscape)).to.be.false;
  });

  it("hasJwt, session not exists", async () => {
    mockAuth
      .expects(`getSession`)
      .withExactArgs(BasRemoteAuthenticationProvider.id, [landscape])
      .resolves(undefined);
    expect(await authUtilsProxy.hasJwt(landscape)).to.be.false;
  });

  it("hasJwt, session exists, token broken", async () => {
    mockAuth
      .expects(`getSession`)
      .withExactArgs(BasRemoteAuthenticationProvider.id, [landscape])
      .resolves({ accessToken: `token` });
    expect(await authUtilsProxy.hasJwt(landscape)).to.be.false;
  });

  describe(`ext-login unit test for "mac"`, () => {
    let mockListener: SinonMock;

    beforeEach(() => {
      mockListener = mock(listenerProxy);
      stub(authUtilsProxy, "JWT_TIMEOUT").value(1000);
      mockOs.expects("platform").atLeast(3).returns("darwin");
    });

    afterEach(() => {
      mockListener.verify();
    });

    it("retrieveJwt, login suceedded", async () => {
      mockUri.expects("parse").returns({ psPath: landscape });
      mockEnv.expects("openExternal").resolves(true);
      mockListener.expects("dispose").returns(undefined);
      setTimeout(() => {
        handlerProxy({ jwt: "token" });
      }, 100);
      expect(await authUtilsProxy.retrieveJwt(landscape)).to.be.equal(`token`);
    });

    it("retrieveJwt, wrong jwt received", async () => {
      mockUri.expects("parse").returns({ psPath: landscape });
      mockEnv.expects("openExternal").resolves(true);
      mockListener.expects("dispose").returns({});
      mockWindow
        .expects("showErrorMessage")
        .withExactArgs(messages.err_incorrect_jwt(landscape))
        .resolves();
      setTimeout(() => {
        handlerProxy({ jwt: `<html> authentication wrong </html>` });
      }, 100);
      expect(await authUtilsProxy.retrieveJwt(landscape)).to.be.undefined;
    });

    it("retrieveJwt, browser not accepted", async () => {
      mockUri.expects("parse").returns({ psPath: landscape });
      mockEnv.expects("openExternal").resolves(false);
      mockListener.expects("dispose").returns({});
      expect(await authUtilsProxy.retrieveJwt(landscape)).to.be.empty;
    });

    it("retrieveJwt, login timeout", async () => {
      mockUri.expects("parse").returns({ psPath: landscape });
      mockEnv.expects("openExternal").resolves(true);
      mockListener.expects("dispose").returns({});
      mockWindow
        .expects("showErrorMessage")
        .withExactArgs(`Login time out in 1000 ms.`)
        .resolves();
      expect(await authUtilsProxy.retrieveJwt(landscape)).to.be.undefined;
    });
  });

  describe(`ext-login unit test"`, () => {
    let status: any;
    const request = {
      body: {
        jwt: ``,
      },
    };
    const response = {
      send: (s: any) => {
        status = s;
      },
    };

    beforeEach(() => {
      status = {};
      request.body.jwt = ``;
      stub(authUtilsProxy, "JWT_TIMEOUT").value(1000);
      mockOs.expects("platform").atMost(3).returns("win");
    });

    it("retrieveJwt, login suceedded", async () => {
      mockUri.expects("parse").returns({ psPath: landscape });
      mockEnv.expects("openExternal").resolves(true);
      request.body.jwt = `token`;
      setTimeout(() => {
        expect(extLoginListener).to.be.ok;
        extLoginListener!(request, response);
      }, 100);
      expect(await authUtilsProxy.retrieveJwt(landscape)).to.be.equal(`token`);
      expect(status).to.be.deep.equal({ status: "ok" });
    });

    it("retrieveJwt, empty jwt received", async () => {
      mockUri.expects("parse").returns({ psPath: landscape });
      mockEnv.expects("openExternal").resolves(true);
      mockWindow
        .expects("showErrorMessage")
        .withExactArgs(messages.err_incorrect_jwt(landscape))
        .resolves();
      setTimeout(() => {
        expect(extLoginListener).to.be.ok;
        extLoginListener!(request, response);
      }, 100);
      expect(await authUtilsProxy.retrieveJwt(landscape)).to.be.undefined;
      expect(status).to.be.deep.equal({ status: "error" });
    });

    it("retrieveJwt, wrong jwt received", async () => {
      mockUri.expects("parse").returns({ psPath: landscape });
      mockEnv.expects("openExternal").resolves(true);
      mockWindow
        .expects("showErrorMessage")
        .withExactArgs(messages.err_incorrect_jwt(landscape))
        .resolves();
      request.body.jwt = `<html> wrong flow </html>`;
      setTimeout(() => {
        expect(extLoginListener).to.be.ok;
        extLoginListener!(request, response);
      }, 100);
      expect(await authUtilsProxy.retrieveJwt(landscape)).to.be.undefined;
      expect(status).to.be.deep.equal({ status: "error" });
    });

    it("retrieveJwt, wrong request bdoy received", async () => {
      mockUri.expects("parse").returns({ psPath: landscape });
      mockEnv.expects("openExternal").resolves(true);
      mockWindow
        .expects("showErrorMessage")
        .withExactArgs(messages.err_incorrect_jwt(landscape))
        .resolves();
      setTimeout(() => {
        expect(extLoginListener).to.be.ok;
        extLoginListener!({}, response);
      }, 100);
      expect(await authUtilsProxy.retrieveJwt(landscape)).to.be.undefined;
      expect(status).to.be.deep.equal({ status: "error" });
    });

    it("retrieveJwt, empty request received", async () => {
      mockUri.expects("parse").returns({ psPath: landscape });
      mockEnv.expects("openExternal").resolves(true);
      mockWindow
        .expects("showErrorMessage")
        .withExactArgs(messages.err_incorrect_jwt(landscape))
        .resolves();
      setTimeout(() => {
        expect(extLoginListener).to.be.ok;
        extLoginListener!(undefined, response);
      }, 100);
      expect(await authUtilsProxy.retrieveJwt(landscape)).to.be.undefined;
      expect(status).to.be.deep.equal({ status: "error" });
    });

    it("retrieveJwt, on server error", async () => {
      mockUri.expects("parse").returns({ psPath: landscape });
      mockEnv.expects("openExternal").resolves(true);
      const err = new Error(`server error`);
      mockWindow
        .expects("showErrorMessage")
        .withExactArgs(messages.err_listening(err.message, landscape))
        .resolves();
      setTimeout(() => {
        expect(cbOnServerError).to.be.ok;
        cbOnServerError!(err);
      }, 100);
      expect(await authUtilsProxy.retrieveJwt(landscape)).to.be.undefined;
    });

    it("retrieveJwt, browser not accepted", async () => {
      mockUri.expects("parse").returns({ psPath: landscape });
      mockEnv.expects("openExternal").resolves(false);
      expect(await authUtilsProxy.retrieveJwt(landscape)).to.be.undefined;
    });

    it("retrieveJwt, login timeout", async () => {
      mockUri.expects("parse").returns({ psPath: landscape });
      mockEnv.expects("openExternal").resolves(true);
      mockWindow
        .expects("showErrorMessage")
        .withExactArgs(`Login time out in 1000 ms.`)
        .resolves();
      setTimeout(() => {
        expect(extLoginListener).to.be.ok;
      }, 100);
      expect(await authUtilsProxy.retrieveJwt(landscape)).to.be.undefined;
    });
  });
});
