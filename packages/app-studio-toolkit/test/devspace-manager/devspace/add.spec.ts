import { SinonMock, mock } from "sinon";

import * as devspaceModule from "../../../src/devspace-manager/devspace/add";
import { LandscapeNode } from "../../../src/devspace-manager/tree/treeItems";
import proxyquire from "proxyquire";

describe("cmdDevSpaceAdd unit test", () => {
  let devspaceAddProxy: typeof devspaceModule;
  const landscapeProxy = {
    autoRefresh: (rate: number, timeout: number): void => {},
  };

  before(() => {
    devspaceAddProxy = proxyquire(
      "../../../src/devspace-manager/devspace/add",
      {
        "../landscape/landscape": landscapeProxy,
      }
    );
  });

  let mockLandscape: SinonMock;
  beforeEach(() => {
    mockLandscape = mock(landscapeProxy);
  });

  afterEach(() => {
    mockLandscape.verify();
  });

  const node: LandscapeNode = <LandscapeNode>{};

  it("cmdLandscapeOpenDevSpaceManager, open true", async () => {
    mockLandscape.expects(`autoRefresh`).returns(true);
    await devspaceAddProxy.cmdDevSpaceAdd(node);
  });
});
