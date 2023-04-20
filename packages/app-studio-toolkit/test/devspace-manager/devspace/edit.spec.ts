import proxyquire from "proxyquire";

import * as devspaceModule from "../../../src/devspace-manager/devspace/edit";
import { DevSpaceNode } from "../../../src/devspace-manager/tree/treeItems";

describe("cmdDevSpaceEdit unit test", () => {
  let devspaceEditProxy: typeof devspaceModule;

  before(() => {
    devspaceEditProxy = proxyquire(
      "../../../src/devspace-manager/devspace/edit",
      {}
    );
  });

  const node: DevSpaceNode = <DevSpaceNode>{};

  it("cmdDevSpaceEdit, ok", async () => {
    await devspaceEditProxy.cmdDevSpaceEdit(node);
  });
});
