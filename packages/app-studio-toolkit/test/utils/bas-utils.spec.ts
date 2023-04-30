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

const testVscode = {
  extensions: proxyExtension,
  env: proxyEnv,
  ExtensionKind: proxyExtensionKind,
};

mockVscode(testVscode, "dist/src/utils/bas-utils.js");
import { isRunInBAS } from "../../src/utils/bas-utils";

describe("bas-utils unit test", () => {
  let sandbox: SinonSandbox;
  let mockExtension: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    mockExtension = sandbox.mock(proxyExtension);
  });

  afterEach(() => {
    mockExtension.verify();
  });

  const landscape = `https://my-landscape.test.com`;

  describe("isRunInBAS scope", () => {
    it("isRunInBAS, running locally, process.env.WS_BASE_URL is undefined", () => {
      sandbox.stub(process, `env`).value({});
      expect(isRunInBAS()).to.be.false;
    });

    it("isRunInBAS, running through ssh-remote, process.env.WS_BASE_URL is defined", () => {
      sandbox.stub(process, `env`).value({ WS_BASE_URL: landscape });
      sandbox.stub(proxyEnv, `remoteName`).value(`ssh-remote`);
      expect(isRunInBAS()).to.be.false;
    });

    it("isRunInBAS, running in BAS, extensionKind === 'Workspace'", () => {
      sandbox.stub(process, `env`).value({ WS_BASE_URL: landscape });
      sandbox.stub(proxyEnv, `remoteName`).value(landscape);
      mockExtension
        .expects(`getExtension`)
        .returns({ extensionKind: proxyExtensionKind.Workspace });
      expect(isRunInBAS()).to.be.true;
    });

    it("isRunInBAS, running in BAS, extensionKind === 'UI'", () => {
      sandbox.stub(process, `env`).value({ WS_BASE_URL: landscape });
      sandbox.stub(proxyEnv, `remoteName`).value(landscape);
      mockExtension
        .expects(`getExtension`)
        .returns({ extensionKind: proxyExtensionKind.UI });
      expect(isRunInBAS()).to.be.false;
    });

    it("isRunInBAS, running in BAS, extension undefined", () => {
      sandbox.stub(process, `env`).value({ WS_BASE_URL: landscape });
      sandbox.stub(proxyEnv, `remoteName`).value(landscape);
      mockExtension.expects(`getExtension`).returns(undefined);
      expect(isRunInBAS()).to.be.false;
    });
  });
});
