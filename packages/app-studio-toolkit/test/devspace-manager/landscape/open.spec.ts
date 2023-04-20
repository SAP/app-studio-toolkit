import { expect } from "chai";
import { mockVscode } from "../../../test/mockUtil";
import { SinonMock, mock } from "sinon";

const testVscode = {
  env: {
    openExternal: () => {
      throw new Error("not implemented");
    },
  },
  Uri: {
    parse: () => {
      throw new Error("not implemented");
    },
  },
};

mockVscode(testVscode, "dist/src/devspace-manager/landscape/open.js");
import { cmdLandscapeOpenDevSpaceManager } from "../../../src/devspace-manager/landscape/open";
import { LandscapeNode } from "../../../src/devspace-manager/tree/treeItems";

describe("landscapes open unit test", () => {
  let mockUrl: SinonMock;
  let mockEnv: SinonMock;
  beforeEach(() => {
    mockUrl = mock(testVscode.Uri);
    mockEnv = mock(testVscode.env);
  });

  afterEach(() => {
    mockUrl.verify();
    mockEnv.verify();
  });

  const node = {
    label: "landscape-1",
    url: "https://my.landscape-1.com",
  } as LandscapeNode;

  const url = {
    host: node.url,
  };

  it("cmdLandscapeOpenDevSpaceManager, open true", async () => {
    mockUrl.expects("parse").withExactArgs(node.url).returns(url);
    mockEnv.expects("openExternal").withExactArgs(url).resolves(true);
    expect(await cmdLandscapeOpenDevSpaceManager(node)).to.be.true;
  });

  it("cmdLandscapeOpenDevSpaceManager, open false", async () => {
    mockUrl.expects("parse").withExactArgs(node.url).returns(url);
    mockEnv.expects("openExternal").withExactArgs(url).resolves(false);
    expect(await cmdLandscapeOpenDevSpaceManager(node)).to.be.false;
  });
});
