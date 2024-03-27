import { SinonMock, SinonSandbox, createSandbox, mock } from "sinon";

import * as devspaceModule from "../../../src/devspace-manager/devspace/open";
import proxyquire from "proxyquire";
import { fail } from "assert";
import { expect } from "chai";

describe("cmdDevSpaceOpen unit test", () => {
  let devspaceOpenProxy: typeof devspaceModule;
  const proxyEnv = {
    openExternal: () => {
      throw new Error("not implemented");
    },
  };

  const proxyUri = {
    parse: () => {
      throw new Error("not implemented");
    },
  };

  const proxyWindow = {
    showInputBox: async () => {
      return Promise.resolve("/home/user/projects/project1");
    },
  };

  let sandbox: SinonSandbox;
  before(() => {
    devspaceOpenProxy = proxyquire(
      "../../../src/devspace-manager/devspace/open",
      {
        vscode: {
          env: proxyEnv,
          Uri: proxyUri,
          window: proxyWindow,
          "@noCallThru": true,
        },
      }
    );
    sandbox = createSandbox();
  });

  let mockUri: SinonMock;
  let mockEnv: SinonMock;

  beforeEach(() => {
    mockUri = mock(proxyUri);
    mockEnv = mock(proxyEnv);
  });

  afterEach(() => {
    sandbox.restore();
    mockUri.verify();
    mockEnv.verify();
  });

  const landscape = `https://my.test.landscape-1.com`;
  const wsId = `test-abcd-id`;

  it("cmdOpenInVSCode, succedded", () => {
    sandbox.stub(process, `env`).value({
      H2O_URL: landscape,
      WORKSPACE_ID: wsId,
    });
    mockUri
      .expects(`parse`)
      .withExactArgs(
        `vscode://SAPOSS.app-studio-toolkit/open?landscape=my.test.landscape-1.com&devspaceid=abcd-id`
      )
      .returns({});
    mockEnv.expects(`openExternal`).resolves();
    devspaceOpenProxy.cmdOpenInVSCode();
  });

  it("cmdOpenInVSCode, H2O_URL is undefined", () => {
    sandbox.stub(process, `env`).value({});
    try {
      devspaceOpenProxy.cmdOpenInVSCode();
      fail(`should fail`);
    } catch (e) {
      expect(e.message.startsWith(`Invalid URL`)).to.be.true;
    }
  });

  it("cmdOpenInVSCode, H2O_URL is incorrect format", () => {
    sandbox.stub(process, `env`).value({
      H2O_URL: `my.lanscape.com`,
    });
    try {
      devspaceOpenProxy.cmdOpenInVSCode();
      fail(`should fail`);
    } catch (e) {
      expect(e.message.startsWith(`Invalid URL`)).to.be.true;
    }
  });

  it("cmdOpenInVSCode, WORKSPACE_ID is incorrect", () => {
    sandbox.stub(process, `env`).value({
      H2O_URL: landscape,
      WORKSPACE_ID: `abcd-1234`,
    });
    mockUri
      .expects(`parse`)
      .withExactArgs(
        `vscode://SAPOSS.app-studio-toolkit/open?landscape=my.test.landscape-1.com&devspaceid=1234`
      )
      .returns({});
    mockEnv.expects(`openExternal`).resolves();
    devspaceOpenProxy.cmdOpenInVSCode();
  });

  it("cmdOpenInVSCode, WORKSPACE_ID is wrong format", () => {
    sandbox.stub(process, `env`).value({
      H2O_URL: landscape,
      WORKSPACE_ID: `test-abcd.1234`,
    });
    mockUri
      .expects(`parse`)
      .withExactArgs(
        `vscode://SAPOSS.app-studio-toolkit/open?landscape=my.test.landscape-1.com&devspaceid=abcd.1234`
      )
      .returns({});
    mockEnv.expects(`openExternal`).resolves();
    devspaceOpenProxy.cmdOpenInVSCode();
  });

  it("cmdOpenInVSCode, WORKSPACE_ID is undefined", () => {
    sandbox.stub(process, `env`).value({
      H2O_URL: landscape,
    });
    mockUri
      .expects(`parse`)
      .withExactArgs(
        `vscode://SAPOSS.app-studio-toolkit/open?landscape=my.test.landscape-1.com&devspaceid=`
      )
      .returns({});
    mockEnv.expects(`openExternal`).resolves();
    devspaceOpenProxy.cmdOpenInVSCode();
  });

  it("cmdOpenProjectInVSCode, succedded", async () => {
    sandbox.stub(process, `env`).value({
      H2O_URL: landscape,
      WORKSPACE_ID: wsId,
    });
    mockUri
      .expects(`parse`)
      .withExactArgs(
        `vscode://SAPOSS.app-studio-toolkit/open?landscape=my.test.landscape-1.com&devspaceid=abcd-id&folderpath=/home/user/projects/project1`
      )
      .returns({});
    mockEnv.expects(`openExternal`).resolves();
    await devspaceOpenProxy.cmdOpenProjectInVSCode();
  });

  it("cmdOpenProjectInVSCode, H2O_URL is undefined", async () => {
    sandbox.stub(process, `env`).value({});
    try {
      await devspaceOpenProxy.cmdOpenProjectInVSCode();
      fail(`should fail`);
    } catch (e) {
      expect(e.message.startsWith(`Invalid URL`)).to.be.true;
    }
  });

  it("cmdOpenProjectInVSCode, WORKSPACE_ID is undefined", async () => {
    sandbox.stub(process, `env`).value({
      H2O_URL: landscape,
    });
    mockUri
      .expects(`parse`)
      .withExactArgs(
        `vscode://SAPOSS.app-studio-toolkit/open?landscape=my.test.landscape-1.com&devspaceid=&folderpath=/home/user/projects/project1`
      )
      .returns({});
    mockEnv.expects(`openExternal`).resolves();
    await devspaceOpenProxy.cmdOpenProjectInVSCode();
  });
});
