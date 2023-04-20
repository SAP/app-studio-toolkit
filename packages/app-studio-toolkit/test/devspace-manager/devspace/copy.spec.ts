import { SinonMock, mock } from "sinon";
import proxyquire from "proxyquire";

import * as devspaceModule from "../../../src/devspace-manager/devspace/copy";
import { DevSpaceNode } from "../../../src/devspace-manager/tree/treeItems";
import { messages } from "../../../src/devspace-manager/common/messages";

describe("cmdCopyWsId unit test", () => {
  let devspaceCopyProxy: typeof devspaceModule.cmdCopyWsId;

  const proxyWindow = {
    showErrorMessage: () => {
      throw new Error("not implemented");
    },
    showInformationMessage: () => {
      throw new Error("not implemented");
    },
  };

  const proxyEnv = {
    clipboard: {
      writeText: () => {
        throw new Error("not implemented");
      },
    },
  };

  before(() => {
    devspaceCopyProxy = proxyquire(
      "../../../src/devspace-manager/devspace/copy",
      {
        vscode: {
          env: proxyEnv,
          window: proxyWindow,
          "@noCallThru": true,
        },
      }
    ).cmdCopyWsId;
  });

  let mockClip: SinonMock;
  let mockWindow: SinonMock;

  beforeEach(() => {
    mockClip = mock(proxyEnv.clipboard);
    mockWindow = mock(proxyWindow);
  });

  afterEach(() => {
    mockClip.verify();
    mockWindow.verify();
  });

  const node: DevSpaceNode = <DevSpaceNode>{
    id: `ws-id`,
  };

  it("cmdCopyWsId, succedded", async () => {
    mockClip.expects(`writeText`).withExactArgs(node.id).resolves();
    mockWindow
      .expects(`showInformationMessage`)
      .withExactArgs(messages.info_wsid_copied)
      .resolves();
    await devspaceCopyProxy(node);
  });

  it("cmdCopyWsId, failed", async () => {
    const err = new Error(`error`);
    mockClip.expects(`writeText`).withExactArgs(node.id).rejects(err);
    mockWindow
      .expects(`showErrorMessage`)
      .withExactArgs(messages.err_copy_devspace_id(err.message))
      .resolves();
    await devspaceCopyProxy(node);
  });
});
