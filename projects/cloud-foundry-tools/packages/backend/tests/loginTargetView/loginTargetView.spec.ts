import { expect } from "chai";
import { fail } from "assert";
import * as proxyquire from "proxyquire";
import { createSandbox, mock, SinonMock, SinonSandbox } from "sinon";
import { cfendpoint } from "@sap/bas-sdk";
import { OK, Organization, Space, SSOLoginOptions } from "@sap/cf-tools";
import { RpcExtension } from "@sap-devx/webview-rpc/out.ext/rpc-extension";
import * as nsVsMock from "./../ext/mockVscode";
import { mockVscode } from "../ext/mockUtil";
import * as cfLocal from "@sap/cf-tools/out/src/cf-local";
import { messages } from "../../src/messages";
import * as path from "path";
import * as fs from "fs";

nsVsMock.setTestRoots(["/", "/some_path"]);

mockVscode(nsVsMock.testVscode, "src/cfViewCommands.ts");
mockVscode(nsVsMock.testVscode, "src/logger/logger-wrapper.ts");
mockVscode(nsVsMock.testVscode, "src/commands.ts");

describe("loginTargetView tests", () => {
  let sandbox: SinonSandbox;
  let cfApiMock: SinonMock;
  let cfFsMock: SinonMock;
  let cfendpointMock: SinonMock;
  let vscodeWindowMock: SinonMock;
  let cfLocalMock: SinonMock;
  let vscodeCommandsMock: SinonMock;

  const cfApiProxy = {
    cfGetConfigFileField: () => Promise.reject(new Error("not implemented")),
    cfGetAvailableOrgs: () => Promise.reject(new Error("not implemented")),
    cfGetAvailableSpaces: () => Promise.reject(new Error("not implemented")),
    cfSetOrgSpace: () => Promise.reject(new Error("not implemented")),
  };
  let internal: any;
  let loginTargetInstance: typeof internal.LoginTarget;

  const panelObj = {
    viewType: "myViewType",
    title: "My Webview Panel",
    webview: {
      onDidReceiveMessage: () => {},
      asWebviewUri: (uri: any) => uri,
      onDidDispose: (callback: () => void) => {
        // Simulate panel disposal
        callback();
      },
      html: "",
    },
    options: {}, // Provide appropriate mock data here
    viewColumn: nsVsMock.testVscode.ViewColumn.One,
    active: true,
    visible: true,
    onDidDispose: () => {},
    onDidChangeViewState: () => {}, // Provide appropriate mock data here
    reveal: () => {},
    dispose: () => {},
  };

  let internalModule: any;
  const extensionPath = "api.sap.test.ondemand.com";

  before(() => {
    sandbox = createSandbox();
    internalModule = proxyquire("../../src/loginTargetView/loginTargetView", {
      vscode: {
        ...nsVsMock.testVscode,
        "@noCallThru": true,
      },
      "@sap/cf-tools": cfApiProxy,
      "../extension": {
        getPath: () => extensionPath,
        "@noCallThru": true,
      },
      "@noCallThru": true,
    });
    internal = internalModule.internal;
  });

  beforeEach(() => {
    cfApiMock = mock(cfApiProxy);
    cfFsMock = mock(fs);
    cfendpointMock = mock(cfendpoint);
    cfLocalMock = sandbox.mock(cfLocal);
    vscodeWindowMock = sandbox.mock(nsVsMock.testVscode.window);
    vscodeCommandsMock = sandbox.mock(nsVsMock.testVscode.commands);
  });

  afterEach(() => {
    cfApiMock.verify();
    cfFsMock.verify();
    cfendpointMock.verify();
    cfLocalMock.verify();
    vscodeWindowMock.verify();
    vscodeCommandsMock.verify();
    sandbox.restore();
  });

  const htmlContext = "<html><link href=</link><script src=></script><img src=></img></html>";

  describe("openLoginView", () => {
    it("should open login view and handle login", async () => {
      const panelMock = sandbox.mock(panelObj);
      panelMock.expects("reveal").returns(undefined);
      sandbox.stub(panelObj, "onDidDispose").yields();
      vscodeWindowMock
        .expects("createWebviewPanel")
        .withExactArgs("cfLogin", "Cloud Foundry Sign In", nsVsMock.testVscode.ViewColumn.Beside, {
          enableScripts: true,
          localResourceRoots: [nsVsMock.testVscode.Uri.file(path.join(extensionPath, "dist", "media"))],
        })
        .returns(panelObj);
      cfFsMock
        .expects("readFileSync")
        .withExactArgs(path.join(extensionPath, "dist", "media", "index.html"), "utf8")
        .returns(htmlContext);

      // Stub the rpcInvokeStub for invoking long function with progress form
      sandbox.stub(RpcExtension.prototype, "invoke").resolves(OK);

      expect(await internalModule.openLoginView({ isSplit: true })).to.equal(undefined);
    });
  });

  describe("getOrgs", () => {
    it("should fetch orgs successfully", async () => {
      const orgs: Organization[] = [{ label: "org", guid: "guid" }];
      loginTargetInstance = new internal.LoginTarget(panelObj);

      cfApiMock.expects("cfGetAvailableOrgs").resolves(orgs);

      const result = await loginTargetInstance.getOrgs();

      expect(result).to.deep.equal(orgs);
    });

    it("should handle error when fetching orgs", async () => {
      loginTargetInstance = new internal.LoginTarget(panelObj);

      cfApiMock.expects("cfGetAvailableOrgs").rejects(new Error("Failed to fetch orgs"));

      const result = await loginTargetInstance.getOrgs();

      expect(result).to.deep.equal([]);
    });
  });

  describe("getTarget", () => {
    it("should fetch target successfully", async () => {
      loginTargetInstance = new internal.LoginTarget(panelObj);
      const api = {
        user: "user",
        space: "space",
      };

      const cfLogoutStub = sandbox.stub().resolves(api);
      mockPrivateMethod(loginTargetInstance, cfLogoutStub, "invokeLongFunctionWithProgressForm");

      const result = await loginTargetInstance.getTarget();

      expect(result.user).to.equal(api.user);
      expect(result.space).to.equal(api.space);
    });

    it("should handle error when fetching target", async () => {
      loginTargetInstance = new internal.LoginTarget(panelObj);
      const cfLogoutStub = sandbox.stub().rejects(new Error("Logout error"));
      mockPrivateMethod(loginTargetInstance, cfLogoutStub, "invokeLongFunctionWithProgressForm");

      const result = await loginTargetInstance.getTarget();

      expect(result).to.equal(undefined);
    });
  });

  describe("init", () => {
    it("should initialize with target when logged in", async () => {
      const loginTargetInstance = new internal.LoginTarget(panelObj);

      const cfGetTargetStub = sandbox
        .stub(loginTargetInstance, "getTarget")
        .resolves({ "api endpoint": extensionPath, org: "my-org", space: "my-space" });
      mockPrivateMethod(loginTargetInstance, cfGetTargetStub, "getTarget");

      const cfDefaultLandscape = sandbox.stub().resolves(extensionPath);
      mockPrivateMethod(loginTargetInstance, cfDefaultLandscape, "getCFDefaultLandscape");

      const result = await loginTargetInstance.init();

      expect(result.defaultEndpoint).to.equal(extensionPath);
      expect(result.isLoggedIn).to.be.true;
      expect(result.passcodeUrl).to.equal("login.sap.test.ondemand.com/passcode");
      expect(result.currentOrg).to.equal("my-org");
      expect(result.currentSpace).to.equal("my-space");
    });
  });

  describe("getSpaces", () => {
    it("should fetch spaces successfully", async () => {
      const org = "org-1";
      const spaces: Space[] = [{ label: "space", guid: "guid", orgGUID: "orgGUID" }];
      loginTargetInstance = new internal.LoginTarget(panelObj);

      cfApiMock.expects("cfGetAvailableSpaces").withExactArgs(org).resolves(spaces);

      const result = await loginTargetInstance.getSpaces(org);

      expect(result).to.deep.equal(spaces);
    });

    it("should handle error when fetching spaces", async () => {
      const org = "org-1";
      loginTargetInstance = new internal.LoginTarget(panelObj);

      cfApiMock.expects("cfGetAvailableSpaces").withExactArgs(org).rejects(new Error("Failed to fetch spaces"));

      const result = await loginTargetInstance.getSpaces(org);

      expect(result).to.deep.equal([]);
    });
  });

  describe("getSelectedTarget", () => {
    it("should return selected target", () => {
      const expectedTarget = {
        "api endpoint": extensionPath,
        org: "my-org",
        space: "my-space",
      };

      const loginTargetInstance = new internal.LoginTarget(panelObj);
      loginTargetInstance["currentTarget"] = expectedTarget;

      const result = loginTargetInstance.getSelectedTarget();

      expect(result.org).to.deep.equal(expectedTarget.org);
      expect(result.space).to.deep.equal(expectedTarget.space);
      expect(result.endpoint).to.deep.equal(expectedTarget["api endpoint"]);
    });

    it("should return undefined when no target is selected", () => {
      const loginTargetInstance = new internal.LoginTarget(panelObj);
      loginTargetInstance["currentTarget"] = undefined;

      const result = loginTargetInstance.getSelectedTarget();

      expect(result.org).to.be.undefined;
      expect(result.space).to.be.undefined;
      expect(result.endpoint).to.be.undefined;
    });
  });

  describe("logoutClick", () => {
    it("logoutClick should fail and return false", async () => {
      loginTargetInstance = new internal.LoginTarget(panelObj);

      const cfLogoutStub = sandbox.stub().rejects(new Error("Logout error"));
      mockPrivateMethod(loginTargetInstance, cfLogoutStub, "invokeLongFunctionWithProgressForm");

      const result = await loginTargetInstance.logoutClick();

      expect(result).to.be.false;
      // Additional assertions could be made here if desired
    });

    it("should handle successful logout", async () => {
      const loginTargetInstance = new internal.LoginTarget(panelObj);

      // Mock the cfLogout function to resolve successfully
      const cfLogoutStub = sandbox.stub().resolves();
      loginTargetInstance.invokeLongFunctionWithProgressForm = cfLogoutStub;
      vscodeWindowMock.expects("showInformationMessage").withExactArgs(messages.logout_success).resolves();

      const result = await loginTargetInstance.logoutClick();

      // Check if cfLogout was called
      expect(cfLogoutStub.calledOnce).to.be.true;
      expect(result).to.be.true;
    });
  });

  describe("loginClick", () => {
    it("should handle successful login", async () => {
      loginTargetInstance = new internal.LoginTarget(panelObj);

      // Mock the long function (cfLogin) to return a success result
      const cfLoginStub = sandbox.stub().resolves(OK);
      mockPrivateMethod(loginTargetInstance, cfLoginStub, "invokeLongFunctionWithProgressForm");
      const showMessageStub = vscodeWindowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.login_success)
        .resolves();

      const result = await loginTargetInstance.loginClick({} as SSOLoginOptions);

      expect(result).to.be.true;
      expect(showMessageStub.calledOnceWith(messages.login_success)).to.be.true;
      expect(cfLoginStub.calledOnce).to.be.true;
    });

    it("should handle failed login and show error message", async () => {
      loginTargetInstance = new internal.LoginTarget(panelObj);

      const loginResult = "Failed";
      const showMessageStub = vscodeWindowMock
        .expects("showErrorMessage")
        .withExactArgs(messages.login_failed)
        .resolves();

      // Mock the long function (cfLogin) to return a failure result
      const cfLoginStub = sandbox.stub().resolves(loginResult);
      mockPrivateMethod(loginTargetInstance, cfLoginStub, "invokeLongFunctionWithProgressForm");

      const result = await loginTargetInstance.loginClick({} as SSOLoginOptions);

      expect(result).to.be.false;
      expect(showMessageStub.calledOnceWith(messages.login_failed)).to.be.true;
      expect(cfLoginStub.calledOnce).to.be.true;
    });

    it("should handle login exception and show error message", async () => {
      loginTargetInstance = new internal.LoginTarget(panelObj);

      // Mock the long function (cfLogin) to throw an error
      const cfLoginStub = sandbox.stub().rejects(new Error("Login error"));
      mockPrivateMethod(loginTargetInstance, cfLoginStub, "invokeLongFunctionWithProgressForm");

      const result = await loginTargetInstance.loginClick({} as SSOLoginOptions);

      expect(result).to.be.false;
      expect(cfLoginStub.calledOnce).to.be.true;
    });
  });

  describe("applyTarget", () => {
    it("ok:: applyTarget - successful set org and space", async () => {
      const org = "my-org";
      const space = "my-space";
      loginTargetInstance = new internal.LoginTarget(panelObj);

      // Mock the cfSetOrgSpace function to resolve successfully
      const cfSetOrgSpaceStub = sandbox.stub().resolves(OK);
      cfApiProxy.cfSetOrgSpace = cfSetOrgSpaceStub;

      vscodeWindowMock.expects("showInformationMessage").withExactArgs(messages.success_set_org_space).resolves();

      const result = await loginTargetInstance.applyTarget(org, space);

      // Check if cfSetOrgSpace was called with the correct arguments
      expect(cfSetOrgSpaceStub.calledOnceWith(org, space)).to.be.true;
      expect(result).to.equal(OK);
    });

    it("should handle applyTarget exception and show error message", async () => {
      loginTargetInstance = new internal.LoginTarget(panelObj);

      // Mock the cfSetOrgSpace function to resolve successfully
      cfApiProxy.cfSetOrgSpace = sandbox.stub().throws("err");

      const result = await loginTargetInstance.applyTarget(null, null);

      expect(result).to.equal("Error");
    });
  });

  describe("openPasscodeLink", () => {
    it("should open passcode link in vscode", async () => {
      loginTargetInstance = new internal.LoginTarget(panelObj);

      vscodeCommandsMock.expects("executeCommand").resolves();

      await loginTargetInstance.openPasscodeLink(extensionPath);
    });
  });

  describe("invokeLongFunctionWithProgressForm", () => {
    it("should invoke long function with progress form", async () => {
      loginTargetInstance = new internal.LoginTarget(panelObj);
      const longFunctionStub = sandbox.stub().resolves("result");
      const rpcInvokeStub = sandbox.stub(RpcExtension.prototype, "invoke");

      const result = await loginTargetInstance.invokeLongFunctionWithProgressForm(longFunctionStub, "arg1", "arg2");

      expect(result).to.equal("result");
      expect(rpcInvokeStub.calledTwice).to.be.true;
      expect(rpcInvokeStub.firstCall.calledWith("setBusyIndicator", [true])).to.be.true;
      expect(rpcInvokeStub.secondCall.calledWith("setBusyIndicator", [false])).to.be.true;
    });

    it("should handle error when invoking long function", async () => {
      loginTargetInstance = new internal.LoginTarget(panelObj);
      const longFunctionStub = sandbox.stub().rejects(new Error("Function failed"));
      const rpcInvokeStub = sandbox.stub(RpcExtension.prototype, "invoke");

      try {
        await loginTargetInstance.invokeLongFunctionWithProgressForm(longFunctionStub, "arg1", "arg2");
        fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.equal("Function failed");
        expect(rpcInvokeStub.calledTwice).to.be.true;
        expect(rpcInvokeStub.firstCall.calledWith("setBusyIndicator", [true])).to.be.true;
        expect(rpcInvokeStub.secondCall.calledWith("setBusyIndicator", [false])).to.be.true;
      }
    });
  });

  describe("getCFDefaultLandscape", () => {
    const envEndpoint = "https://my.env.endpoint";
    const fileEndpoint = "https://my.test.endpoint";

    it("ok:: getCFDefaultLandscape - 'Target' is defined in .cf config file - return it first", async () => {
      const loginTargetInstance = new internal.LoginTarget(panelObj);
      cfApiMock.expects("cfGetConfigFileField").withExactArgs("Target").resolves(fileEndpoint);
      expect(await loginTargetInstance.getCFDefaultLandscape()).to.be.equal(fileEndpoint);
    });

    it("ok:: getCFDefaultLandscape - 'Target' is undefined in .cf config file - fetch from env", async () => {
      const loginTargetInstance = new internal.LoginTarget(panelObj);
      cfApiMock.expects("cfGetConfigFileField").withExactArgs("Target").resolves();
      cfendpointMock.expects("getCFEndpoint").resolves(envEndpoint);
      expect(await loginTargetInstance.getCFDefaultLandscape()).to.be.equal(envEndpoint);
    });

    it("fail:: getCFDefaultLandscape - cfGetConfigFileField is rejected", () => {
      const loginTargetInstance = new internal.LoginTarget(panelObj);
      const error = new Error("cfGetConfigFileField rejected");
      cfApiMock.expects("cfGetConfigFileField").withExactArgs("Target").rejects(error);
      return loginTargetInstance
        .getCFDefaultLandscape()
        .then(() => {
          fail("should fail");
        })
        .catch((e: Error) => {
          expect(e.message).to.be.equal(error.message);
        });
    });
  });

  describe("calculatePasscodeUrl", () => {
    it("ok:: calculatePasscodeUrl", () => {
      loginTargetInstance = new internal.LoginTarget(panelObj);
      expect(loginTargetInstance.calculatePasscodeUrl(extensionPath)).to.be.equal(
        "login.sap.test.ondemand.com/passcode"
      );
    });
  });

  function mockPrivateMethod(
    loginTargetInstance: typeof internal.LoginTarget,
    cfLoginStub: any,
    nameofPrivateMethod: string
  ) {
    // Call the private method through the instance
    return (loginTargetInstance[nameofPrivateMethod] = cfLoginStub);
  }
});
