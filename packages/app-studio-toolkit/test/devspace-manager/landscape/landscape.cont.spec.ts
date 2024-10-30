import { expect } from "chai";
import sinon, { SinonMock } from "sinon";
import proxyquire from "proxyquire";
import {
  LandscapeInfo,
  LandscapeConfig,
} from "../../../src/devspace-manager/landscape/landscape";
import { cloneDeep } from "lodash";
import type { QuickPickItem } from "vscode";
import { URL } from "node:url";

describe("Landscape Module Tests", function () {
  let vscodeMocks: any;
  let landscapeModule: any;
  let loggerStub: any;

  let mockGetConfiguration: SinonMock;

  const getConfigurationProxy = {
    get: (v: string) => {
      throw new Error("not implemented");
    },
    update: (): never => {
      throw new Error("not implemented");
    },
  };

  before(function () {
    // Mock the VS Code API
    enum QuickPickItemKindMock {
      Default = 0,
      Separator = 1,
    }

    vscodeMocks = {
      workspace: {
        getConfiguration: () => getConfigurationProxy,
      },
      commands: {
        executeCommand: (): never => {
          throw new Error("not implemented");
        },
      },
      window: {
        showQuickPick: (): never => {
          throw new Error("not implemented");
        },
      },
      authentication: {
        getSession: (): never => {
          throw new Error("not implemented");
        },
      },
      ConfigurationTarget: { Global: 1 },
      QuickPickItemKind: QuickPickItemKindMock,
      AuthenticationGetSessionOptions: {
        create: (): never => {
          throw new Error("not implemented");
        },
      },
    };
    // Mock logger
    loggerStub = {
      info: sinon.stub(),
      error: sinon.stub(),
      debug: sinon.stub(),
    };

    // Proxyquire to inject mocks
    landscapeModule = proxyquire(
      "../../../src/devspace-manager/landscape/landscape",
      {
        vscode: {
          ...vscodeMocks,
          "@noCallThru": true,
        },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- stubbing the logger
        "../../../src/logger/logger": { getLogger: () => loggerStub },
        "@sap/bas-sdk": {
          helpers: { timeUntilJwtExpires: sinon.stub().returns(60000) },
        },
        "../tree/treeItems": { LandscapeNode: sinon.stub() },
        "../../authentication/authProvider": {
          BasRemoteAuthenticationProvider: sinon.stub(),
        },
      }
    );
  });

  beforeEach(function () {
    mockGetConfiguration = sinon.mock(getConfigurationProxy);
  });

  afterEach(function () {
    mockGetConfiguration.verify();
    sinon.restore();
  });

  const config = [
    { url: "https://example.com/", default: true },
    { url: "https://other.com/" },
  ];
  const mockConfig = (v = config) =>
    v.map((con: LandscapeConfig) => JSON.stringify(con)).join("|");

  describe("getLandscapes", function () {
    it("should parse landscapes correctly when configured", async function () {
      mockGetConfiguration
        .expects("get")
        .withExactArgs("sap-remote.landscape-name")
        .returns(mockConfig());
      const landscapes: LandscapeInfo[] = await landscapeModule.getLandscapes();
      expect(landscapes).to.have.lengthOf(2);
      expect(landscapes[0].url).be.equal("https://example.com/");
      expect(landscapes[0].isLoggedIn).be.false;
      expect(landscapes[0].default).be.true;
    });
  });

  describe("getDefaultLandscape", function () {
    it("should return when configured", async function () {
      mockGetConfiguration
        .expects("get")
        .withExactArgs("sap-remote.landscape-name")
        .returns(mockConfig());
      expect(await landscapeModule.getDefaultLandscape()).to.be.equal(
        "https://example.com/"
      );
    });

    it("should return empty when not configured", async function () {
      const copyConfig = cloneDeep(config);
      copyConfig.shift();
      mockGetConfiguration
        .expects("get")
        .withExactArgs("sap-remote.landscape-name")
        .returns(mockConfig(copyConfig));
      expect(await landscapeModule.getDefaultLandscape()).to.be.empty;
    });
  });

  describe("clearDefaultLandscape", function () {
    const localConfig = config.map((con: LandscapeConfig) => ({
      ...con,
      default: true,
    }));

    it("should reset 'default' flag for all entries but not update the configuration", async function () {
      mockGetConfiguration
        .expects("get")
        .withExactArgs("sap-remote.landscape-name")
        .returns(mockConfig(localConfig));
      expect(await landscapeModule.clearDefaultLandscape(false)).be.deep.equal(
        localConfig.map((con: LandscapeConfig) => {
          delete con.default;
          return con;
        })
      );
    });

    it("should reset 'default' flag and update the configuration", async function () {
      mockGetConfiguration
        .expects("get")
        .withExactArgs("sap-remote.landscape-name")
        .returns(mockConfig(localConfig));
      const expectedConfig = localConfig.map((con: LandscapeConfig) => {
        delete con.default;
        return con;
      });
      const value = expectedConfig
        .map((item) => JSON.stringify(item))
        .join("|");
      mockGetConfiguration
        .expects("update")
        .withExactArgs(
          "sap-remote.landscape-name",
          value,
          vscodeMocks.ConfigurationTarget.Global
        )
        .resolves();
      expect(await landscapeModule.clearDefaultLandscape()).be.deep.equal(
        expectedConfig
      );
    });
  });

  describe("setDefaultLandscape", function () {
    const placeHolderText = "Select a landscape for AI metering";
    let mockCommands: SinonMock;
    let mockWindow: SinonMock;

    beforeEach(() => {
      mockCommands = sinon.mock(vscodeMocks.commands);
      mockWindow = sinon.mock(vscodeMocks.window);
    });

    this.afterEach(() => {
      mockCommands.verify();
      mockWindow.verify();
    });

    it("should set a new default landscape", async function () {
      mockGetConfiguration
        .expects("get")
        .withExactArgs("sap-remote.landscape-name")
        .thrice()
        .returns(mockConfig());
      const l = new URL(config[1].url);
      const items: (QuickPickItem & { url?: string })[] = [
        { label: l.hostname, url: l.toString() },
      ];
      items.unshift({
        label: "",
        kind: vscodeMocks.QuickPickItemKind.Separator,
      });
      items.push({ label: "", kind: vscodeMocks.QuickPickItemKind.Separator });
      items.push({ label: "Add another landscape" });
      mockWindow
        .expects("showQuickPick")
        .withExactArgs(items, {
          placeHolder: placeHolderText,
          ignoreFocusOut: true,
        })
        .resolves(items[1]);
      const modified = cloneDeep(config)
        .map((con: LandscapeConfig) => {
          delete con.default;
          return con;
        })
        .map((con: LandscapeConfig) => {
          if (con.url === items[1].url) {
            con.default = true;
          }
          return con;
        });
      const value = modified.map((item) => JSON.stringify(item)).join("|");
      mockGetConfiguration
        .expects("update")
        .withExactArgs(
          "sap-remote.landscape-name",
          value,
          vscodeMocks.ConfigurationTarget.Global
        )
        .resolves();
      mockCommands
        .expects("executeCommand")
        .withExactArgs("local-extension.tree.refresh")
        .once();

      expect(await landscapeModule.setDefaultLandscape()).to.be.true;
    });

    it("should not set a new default landscape when user cancel selection", async function () {
      mockGetConfiguration
        .expects("get")
        .withExactArgs("sap-remote.landscape-name")
        .twice()
        .returns(mockConfig());
      const l = new URL(config[1].url);
      const items: (QuickPickItem & { url?: string })[] = [
        { label: l.hostname, url: l.toString() },
      ];
      items.unshift({
        label: "",
        kind: vscodeMocks.QuickPickItemKind.Separator,
      });
      items.push({ label: "", kind: vscodeMocks.QuickPickItemKind.Separator }); // action section separator
      items.push({ label: "Add another landscape" });
      mockWindow
        .expects("showQuickPick")
        .withExactArgs(items, {
          placeHolder: placeHolderText,
          ignoreFocusOut: true,
        })
        .resolves(undefined);
      mockGetConfiguration.expects("update").never();
      mockCommands.expects("executeCommand").never();

      expect(await landscapeModule.setDefaultLandscape()).to.be.false;
    });

    it("should set a new default landscape when landscape name provided", async function () {
      mockGetConfiguration
        .expects("get")
        .withExactArgs("sap-remote.landscape-name")
        .once()
        .returns(mockConfig());
      const c = { url: "https://new.com/" };
      const added = cloneDeep(config);
      added.push(c);
      const modified = cloneDeep(added)
        .map((con: LandscapeConfig) => {
          delete con.default;
          return con;
        })
        .map((con: LandscapeConfig) => {
          if (con.url === c.url) {
            con.default = true;
          }
          return con;
        });
      const value = modified.map((item) => JSON.stringify(item)).join("|");
      mockGetConfiguration
        .expects("update")
        .withExactArgs(
          "sap-remote.landscape-name",
          value,
          vscodeMocks.ConfigurationTarget.Global
        )
        .resolves();
      mockCommands
        .expects("executeCommand")
        .withExactArgs("local-extension.tree.refresh")
        .once();

      expect(await landscapeModule.setDefaultLandscape(c.url)).to.be.true;
    });

    it("should set a new default landscape when user added a not existed item", async function () {
      mockGetConfiguration
        .expects("get")
        .withExactArgs("sap-remote.landscape-name")
        .twice()
        .returns(mockConfig());
      const l = new URL(config[1].url);
      const items: (QuickPickItem & { url?: string })[] = [
        { label: l.hostname, url: l.toString() },
      ];
      items.unshift({
        label: "",
        kind: vscodeMocks.QuickPickItemKind.Separator,
      });
      items.push({ label: "", kind: vscodeMocks.QuickPickItemKind.Separator });
      items.push({ label: "Add another landscape" });
      mockWindow
        .expects("showQuickPick")
        .withExactArgs(items, {
          placeHolder: placeHolderText,
          ignoreFocusOut: true,
        })
        .resolves(items[items.length - 1]);
      mockCommands
        .expects("executeCommand")
        .withExactArgs("local-extension.landscape.add")
        .resolves();
      const a = new URL("https://new.com/");
      const modifiedItems: (QuickPickItem & { url?: string })[] = [
        { label: l.hostname, url: l.toString() },
        { label: a.hostname, url: a.toString() },
      ];
      modifiedItems.unshift({
        label: "",
        kind: vscodeMocks.QuickPickItemKind.Separator,
      });
      modifiedItems.push({
        label: "",
        kind: vscodeMocks.QuickPickItemKind.Separator,
      });
      modifiedItems.push({ label: "Add another landscape" });
      mockWindow
        .expects("showQuickPick")
        .withExactArgs(modifiedItems, {
          placeHolder: placeHolderText,
          ignoreFocusOut: true,
        })
        .resolves(modifiedItems[2]);

      const newConfig = cloneDeep(config);
      newConfig.push({ url: a.toString(), default: true });
      mockGetConfiguration
        .expects("get")
        .withExactArgs("sap-remote.landscape-name")
        .twice()
        .returns(mockConfig(newConfig));
      const modified = newConfig
        .map((con: LandscapeConfig) => {
          delete con.default;
          return con;
        })
        .map((con: LandscapeConfig) => {
          if (con.url === a.toString()) {
            con.default = true;
          }
          return con;
        });
      const value = modified.map((item) => JSON.stringify(item)).join("|");
      mockGetConfiguration
        .expects("update")
        .withExactArgs(
          "sap-remote.landscape-name",
          value,
          vscodeMocks.ConfigurationTarget.Global
        )
        .resolves();
      mockCommands
        .expects("executeCommand")
        .withExactArgs("local-extension.tree.refresh")
        .once();

      expect(await landscapeModule.setDefaultLandscape()).to.be.true;
    });
  });
});
