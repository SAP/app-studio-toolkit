import proxyquire from "proxyquire";
import { SinonMock, mock } from "sinon";
import * as land from "../../../src/devspace-manager/landscape/delete";
import { LandscapeNode } from "../../../src/devspace-manager/tree/treeItems";
import { messages } from "../../../src/devspace-manager/common/messages";

describe("landscapes delete unit test", () => {
  let cmdLandscapeDeleteProxy: typeof land.cmdLandscapeDelete;
  const proxyWindow = {
    showInformationMessage: () => {
      throw new Error("not implemented");
    },
  };
  const proxyCommands = {
    executeCommand: () => {
      throw new Error("not implemented");
    },
  };
  const removeLandscapeProxy = {
    removeLandscape: () => {
      throw new Error("not implemented");
    },
  };

  before(() => {
    cmdLandscapeDeleteProxy = proxyquire(
      "../../../src/devspace-manager/landscape/delete",
      {
        "./landscape": removeLandscapeProxy,
        vscode: {
          window: proxyWindow,
          commands: proxyCommands,
          "@noCallThru": true,
        },
      }
    ).cmdLandscapeDelete;
  });

  let mockWindow: SinonMock;
  let mockCommands: SinonMock;
  let mockRemoveLandscape: SinonMock;

  beforeEach(() => {
    mockWindow = mock(proxyWindow);
    mockCommands = mock(proxyCommands);
    mockRemoveLandscape = mock(removeLandscapeProxy);
  });

  afterEach(() => {
    mockWindow.verify();
    mockCommands.verify();
    mockRemoveLandscape.verify();
  });

  const node = {
    label: "landscape-1",
    url: "https://my.landscape-1.com",
  } as LandscapeNode;

  it("cmdLandscapeDelete, canceled", async () => {
    mockWindow
      .expects("showInformationMessage")
      .withExactArgs(
        messages.lbl_delete_landscape(node.label),
        ...[messages.lbl_yes, messages.lbl_no]
      )
      .resolves();
    mockRemoveLandscape.expects("removeLandscape").never();
    await cmdLandscapeDeleteProxy(node);
  });

  it("cmdLandscapeDelete, answer no", async () => {
    mockWindow
      .expects("showInformationMessage")
      .withExactArgs(
        messages.lbl_delete_landscape(node.label),
        ...[messages.lbl_yes, messages.lbl_no]
      )
      .resolves(messages.lbl_no);
    mockRemoveLandscape.expects("removeLandscape").never();
    await cmdLandscapeDeleteProxy(node);
  });

  it("cmdLandscapeDelete, answer yes", async () => {
    mockWindow
      .expects("showInformationMessage")
      .withExactArgs(
        messages.lbl_delete_landscape(node.label),
        ...[messages.lbl_yes, messages.lbl_no]
      )
      .resolves(messages.lbl_yes);
    mockCommands
      .expects("executeCommand")
      .withExactArgs("local-extension.tree.refresh")
      .resolves();
    mockRemoveLandscape
      .expects("removeLandscape")
      .withExactArgs(node.url)
      .resolves();
    await cmdLandscapeDeleteProxy(node);
    await new Promise((resolve) => setTimeout(() => resolve(true), 100));
  });

  it("cmdLandscapeDelete, answer yes, removeLandscape rejected", async () => {
    mockWindow
      .expects("showInformationMessage")
      .withExactArgs(
        messages.lbl_delete_landscape(node.label),
        ...[messages.lbl_yes, messages.lbl_no]
      )
      .resolves(messages.lbl_yes);
    mockCommands
      .expects("executeCommand")
      .withExactArgs("local-extension.tree.refresh")
      .resolves();
    mockRemoveLandscape
      .expects("removeLandscape")
      .withExactArgs(node.url)
      .rejects(new Error("e"));
    await cmdLandscapeDeleteProxy(node).catch((e) => "");
    await new Promise((resolve) => setTimeout(() => resolve(true), 100));
  });
});
