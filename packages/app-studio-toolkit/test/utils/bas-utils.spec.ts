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
  isBAS,
  reportProjectTypesToUsageAnalytics,
} from "../../src/utils/bas-utils";
import { devspace } from "@sap/bas-sdk";
import { BasToolkit } from "@sap-devx/app-studio-toolkit-types";
import { createBasToolkitAPI } from "../../src/public-api/create-bas-toolkit-api";
import { WorkspaceApi } from "@sap/artifact-management";
import { AnalyticsWrapper } from "../../src/usage-report/usage-analytics-wrapper";

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

  describe("isBAS scope", () => {
    it("isBAS, running locally, process.env.WS_BASE_URL is undefined", () => {
      sandbox.stub(process, `env`).value({});
      mockCommands
        .expects(`executeCommand`)
        .withExactArgs(
          `setContext`,
          `ext.runPlatform`,
          ExtensionRunMode.desktop
        )
        .resolves();
      expect(isBAS()).to.be.false;
    });

    it("isBAS, running through ssh-remote, process.env.WS_BASE_URL is defined", () => {
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
      expect(isBAS()).to.be.true;
    });

    it("isBAS, running personal-edition", () => {
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
      expect(isBAS()).to.be.true;
      devspaceMock.verify();
    });

    it("isBAS, running in BAS, extensionKind === 'Workspace'", () => {
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
      expect(isBAS()).to.be.true;
    });

    it("isBAS, running in BAS, extensionKind === 'UI'", () => {
      sandbox.stub(process, `env`).value({ WS_BASE_URL: landscape });
      sandbox.stub(proxyEnv, `remoteName`).value(landscape);
      mockExtension
        .expects(`getExtension`)
        .returns({ extensionKind: proxyExtensionKind.UI });
      mockCommands
        .expects(`executeCommand`)
        .withExactArgs(`setContext`, `ext.runPlatform`, ExtensionRunMode.basUi)
        .resolves();
      expect(isBAS()).to.be.false;
    });

    it("isBAS, running in BAS, extension undefined", () => {
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
      expect(isBAS()).to.be.false;
    });

    it("isBAS, running locally through WSL, extension undefined", () => {
      sandbox.stub(process, `env`).value({});
      sandbox.stub(proxyEnv, `remoteName`).value("wsl");
      mockCommands
        .expects(`executeCommand`)
        .withExactArgs(`setContext`, `ext.runPlatform`, ExtensionRunMode.wsl)
        .resolves();
      expect(isBAS()).to.be.false;
    });

    it("isBAS, running locally through SSH, extension undefined", () => {
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
      expect(isBAS()).to.be.false;
    });
  });

  describe("reportProjectTypesToUsageAnalytics scope", () => {
    let mockAnalyticsWrapper: SinonMock;
    let basToolkit: BasToolkit;

    beforeEach(() => {
      mockAnalyticsWrapper = sandbox.mock(AnalyticsWrapper);
    });

    afterEach(() => {
      mockAnalyticsWrapper.verify();
    });

    it("devspaceInfo does not work, no projects exist", async () => {
      /* eslint-disable @typescript-eslint/no-unsafe-return -- test dummy mock */
      const dummyReturnArgsWorkspaceImpl = {
        getProjects() {
          return [];
        },
      } as unknown as WorkspaceApi;

      const dummyBaseBasToolkitApi = {
        getAction() {
          return 666;
        },
      } as unknown as Omit<BasToolkit, "workspaceAPI">;
      /* eslint-enable  @typescript-eslint/no-unsafe-return -- test dummy mock */
      basToolkit = createBasToolkitAPI(
        dummyReturnArgsWorkspaceImpl,
        dummyBaseBasToolkitApi
      );

      const devspaceMock = sandbox.mock(devspace);
      devspaceMock.expects(`getDevspaceInfo`).returns(undefined);

      mockAnalyticsWrapper
        .expects(`traceProjectTypesStatus`)
        .withExactArgs(
          "",
          {}
        )
        .resolves();

      await reportProjectTypesToUsageAnalytics(basToolkit);
    });

    it("getProjects return error", async () => {
      /* eslint-disable @typescript-eslint/no-unsafe-return -- test dummy mock */
      const dummyReturnArgsWorkspaceImpl = {
        getProjects() {
          return new Error();
        },
      } as unknown as WorkspaceApi;

      const dummyBaseBasToolkitApi = {
        getAction() {
          return 666;
        },
      } as unknown as Omit<BasToolkit, "workspaceAPI">;
      /* eslint-enable  @typescript-eslint/no-unsafe-return -- test dummy mock */
      basToolkit = createBasToolkitAPI(
        dummyReturnArgsWorkspaceImpl,
        dummyBaseBasToolkitApi
      );

      const devspaceMock = sandbox.mock(devspace);
      devspaceMock.expects(`getDevspaceInfo`).returns(undefined);

      mockAnalyticsWrapper
        .expects(`traceProjectTypesStatus`)
        .withExactArgs(
          "",
          {}
        )
        .resolves();

      await reportProjectTypesToUsageAnalytics(basToolkit);
    });

    it("devspaceInfo works, a project exists", async () => {
      const projectsMap = [{ name: "testProject", getProjectInfo: () => { return { type: "testType", path: "testPath" } } }, { name: "testProject2", getProjectInfo: () => { return { type: "testType2", path: "testPath2" } } }]
      /* eslint-disable @typescript-eslint/no-unsafe-return -- test dummy mock */
      const dummyReturnArgsWorkspaceImpl = {
        getProjects() {
          return projectsMap;
        },
      } as unknown as WorkspaceApi;

      const dummyBaseBasToolkitApi = {
        getAction() {
          return 666;
        },
      } as unknown as Omit<BasToolkit, "workspaceAPI">;
      /* eslint-enable  @typescript-eslint/no-unsafe-return -- test dummy mock */
      basToolkit = createBasToolkitAPI(
        dummyReturnArgsWorkspaceImpl,
        dummyBaseBasToolkitApi
      );

      const devspaceMock = sandbox.mock(devspace);
      devspaceMock.expects(`getDevspaceInfo`).returns({ packDisplayName: "testDisplayName" });

      mockAnalyticsWrapper
        .expects(`traceProjectTypesStatus`)
        .withExactArgs(
          `testDisplayName`,
          { testType: 1, testType2: 1 }
        )
        .resolves();

      await reportProjectTypesToUsageAnalytics(basToolkit);
    });

  });
});
