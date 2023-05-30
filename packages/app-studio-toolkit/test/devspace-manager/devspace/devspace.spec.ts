import { expect } from "chai";
import { SinonMock, mock } from "sinon";
import proxyquire from "proxyquire";

import * as devspaceModule from "../../../src/devspace-manager/devspace/devspace";
import { messages } from "../../../src/devspace-manager/common/messages";
import { devspace } from "@sap/bas-sdk";
import { cloneDeep } from "lodash";

describe("getDevSpaces unit test", () => {
  let devspaceProxy: typeof devspaceModule;

  const proxyWindow = {
    showErrorMessage: () => {
      throw new Error("not implemented");
    },
  };

  const proxyDevSpace = {
    devspace: {
      getDevSpaces: () => {
        throw new Error("not implemented");
      },
      DevSpaceStatus: devspace.DevSpaceStatus,
      PackName: devspace.PackName,
    },
  };

  const proxyAuthUtils = {
    getJwt: () => {
      throw new Error(`not implemented`);
    },
  };

  before(() => {
    devspaceProxy = proxyquire(
      "../../../src/devspace-manager/devspace/devspace",
      {
        vscode: {
          window: proxyWindow,
          "@noCallThru": true,
        },
        "@sap/bas-sdk": proxyDevSpace,
        "../../authentication/auth-utils": proxyAuthUtils,
      }
    );
  });

  let mockAuthUtils: SinonMock;
  let mockDevspace: SinonMock;
  let mockWindow: SinonMock;

  beforeEach(() => {
    mockAuthUtils = mock(proxyAuthUtils);
    mockDevspace = mock(proxyDevSpace.devspace);
    mockWindow = mock(proxyWindow);
  });

  afterEach(() => {
    mockAuthUtils.verify();
    mockDevspace.verify();
    mockWindow.verify();
  });

  const landscape = `https://my.landscape-1.com`;
  const jwt = `devscape-jwt`;

  const devspaces: devspace.DevspaceInfo[] = [
    {
      devspaceDisplayName: `devspaceDisplayName-1`,
      devspaceOrigin: `devspaceOrigin`,
      pack: `pack-1`,
      packDisplayName: `packDisplayName-1`,
      url: `url`,
      id: `id`,
      optionalExtensions: `optionalExtensions`,
      technicalExtensions: `technicalExtensions`,
      status: `STOPPED`,
    },
    {
      devspaceDisplayName: `devspaceDisplayName-2`,
      devspaceOrigin: `devspaceOrigin`,
      pack: `pack-2`,
      packDisplayName: `packDisplayName-2`,
      url: `url-2`,
      id: `id-2`,
      optionalExtensions: `optionalExtensions`,
      technicalExtensions: `technicalExtensions`,
      status: `RUNNING`,
    },
  ];

  it("getDevSpaces, succedded", async () => {
    mockAuthUtils.expects(`getJwt`).withExactArgs(landscape).resolves(jwt);
    mockDevspace
      .expects(`getDevSpaces`)
      .withExactArgs(landscape, jwt)
      .resolves(devspaces);
    expect(await devspaceProxy.getDevSpaces(landscape)).to.be.deep.equal([
      {
        devspaceDisplayName: devspaces[0].devspaceDisplayName,
        devspaceOrigin: devspaces[0].devspaceOrigin,
        pack: devspaces[0].pack,
        packDisplayName: devspaces[0].packDisplayName,
        url: devspaces[0].url,
        id: devspaces[0].id,
        optionalExtensions: devspaces[0].optionalExtensions,
        technicalExtensions: devspaces[0].technicalExtensions,
        status: devspace.DevSpaceStatus.STOPPED,
      },
      {
        devspaceDisplayName: devspaces[1].devspaceDisplayName,
        devspaceOrigin: devspaces[1].devspaceOrigin,
        pack: devspaces[1].pack,
        packDisplayName: devspaces[1].packDisplayName,
        url: devspaces[1].url,
        id: devspaces[1].id,
        optionalExtensions: devspaces[1].optionalExtensions,
        technicalExtensions: devspaces[1].technicalExtensions,
        status: devspace.DevSpaceStatus.RUNNING,
      },
    ]);
  });

  it("getDevSpaces, pack patch applied succedded", async () => {
    mockAuthUtils.expects(`getJwt`).withExactArgs(landscape).resolves(jwt);
    const cloned = cloneDeep(devspaces);
    cloned[0].pack = `SAP HANA Public`;
    mockDevspace
      .expects(`getDevSpaces`)
      .withExactArgs(landscape, jwt)
      .resolves(cloned);
    const expected = (await devspaceProxy.getDevSpaces(
      landscape
    )) as devspaceModule.DevSpaceInfo[];
    expect(expected[0].pack).to.be.equal(devspace.PackName.HANA);
  });

  it("getDevSpaces, failed", async () => {
    const err = new Error(`getting jwt error`);
    mockAuthUtils.expects(`getJwt`).withExactArgs(landscape).rejects(err);
    mockWindow
      .expects(`showErrorMessage`)
      .withExactArgs(messages.err_get_devspace(err.toString()))
      .resolves();
    expect(await devspaceProxy.getDevSpaces(landscape)).to.be.undefined;
  });
});
