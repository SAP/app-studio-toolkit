import { expect } from "chai";
import { mockVscode, testVscode } from "./utils/mockVSCode";

mockVscode("/src/multi-step-select");
import { __internal } from "../src/multi-step-select";
import { map, uniq } from "lodash";
import { MISC } from "../src/utils/ws-folder";
import * as e2eConfig from "../src/misc/common-e2e-config";
import { SinonMock, SinonSandbox, createSandbox } from "sinon";
import * as e2EConfig from "../src/misc/e2e-config";
import * as path from "path";

describe("multi-step-selection scope", () => {
  const roots = [
    path.join(path.sep, "user", "projects", "project1"),
    path.join(path.sep, "user", "projects", "project2"),
    path.join(path.sep, "user", "projects", "project3"),
  ];
  const taskContributed1 = {
    label: "Template: task1",
    type: "testType",
    prop1: "value1",
    description: "task description",
    taskType: "testIntent",
    __intent: "build",
    __wsFolder: roots[0],
    __extensionName: "testExtension",
  };

  const taskContributed2 = {
    label: "Template: task2",
    type: "extendedTestType",
    prop1: "value1",
    taskType: "testIntent",
    __intent: "intent-2",
    __wsFolder: roots[0],
    __extensionName: "testExtension",
  };

  const taskNotContributed = {
    label: "Template: task3",
    prop1: "value1",
    type: "otherType",
    taskType: "testIntent",
    __intent: "unknown",
    __wsFolder: roots[1],
    __extensionName: "testExtension",
  };

  const taskContributed4 = {
    label: "Template: task4",
    prop1: "value1",
    type: "otherType",
    taskType: "testIntent",
    __wsFolder: roots[1],
    __extensionName: "testExtension",
  };

  const taskContributed5 = {
    label: "Template: task5",
    prop1: "value1",
    type: "otherType",
    taskType: "testIntent",
    __intent: "deploy",
    __wsFolder: roots[2],
    __extensionName: "testExtension",
  };

  const tasks = [taskContributed1, taskContributed2, taskNotContributed, taskContributed4, taskContributed5];

  let sandbox: SinonSandbox;
  let mockFioriE2eCinfig: SinonMock;
  let mockE2eConfig: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  beforeEach(() => {
    mockFioriE2eCinfig = sandbox.mock(e2eConfig);
    mockE2eConfig = sandbox.mock(e2EConfig);
  });

  afterEach(() => {
    mockFioriE2eCinfig.verify();
    mockE2eConfig.verify();
    sandbox.restore();
  });

  it("Miscellaneous item verification", async () => {
    expect(__internal.miscItem).to.be.deep.equal({ label: "$(list-unordered)", description: MISC, type: "intent" });
  });

  it("grabProjectItems", async () => {
    let folders = uniq(map(tasks, "__wsFolder"));
    const projectsInfo = [
      { project: "proj1", wsFolder: folders[0] },
      { project: "proj2", wsFolder: folders[0] },
    ];
    folders.every((_, index) =>
      mockE2eConfig
        .expects("collectProjects")
        .withExactArgs(_)
        .resolves(!index ? projectsInfo : []),
    );
    folders = folders.concat([
      path.join(projectsInfo[0].wsFolder, projectsInfo[0].project),
      path.join(projectsInfo[1].wsFolder, projectsInfo[1].project),
    ]);
    expect(await __internal.grabProjectItems(tasks)).to.be.deep.equal(
      map(folders, (_) => {
        return { label: "$(folder)", description: _ };
      }),
    );
  });

  it("grabProjectItems - project filter received", async () => {
    expect(await __internal.grabProjectItems(tasks, roots[0])).to.be.deep.equal([
      { label: "$(folder)", description: roots[0] },
    ]);
  });

  it("grabProjectItems - project filter received but not matched", async () => {
    expect(await __internal.grabProjectItems(tasks, path.join(path.sep, "user", "unknown", "path"))).to.be.deep.equal(
      map(uniq(map(tasks, "__wsFolder")), (_) => {
        return { label: "$(folder)", description: _ };
      }),
    );
  });

  it("grabTasksByGroup - `build` group required", async () => {
    mockFioriE2eCinfig.expects("getConfigDeployPickItems").resolves([]);
    expect(await __internal.grabTasksByGroup(tasks, roots[0], "BuIld")).to.deep.equal([
      { label: taskContributed1.__intent, kind: testVscode.QuickPickItemKind.Separator },
      {
        ...taskContributed1,
        ...{ description: taskContributed1.type },
        ...{ detail: taskContributed1.description },
      },
    ]);
  });

  it("grabTasksByGroup - `deploy` group required", async () => {
    mockFioriE2eCinfig.expects("getConfigDeployPickItems").resolves([]);
    expect(await __internal.grabTasksByGroup(tasks, roots[2], "deplOy")).to.be.deep.equal([
      { label: taskContributed5.__intent, kind: testVscode.QuickPickItemKind.Separator },
      { ...taskContributed5, ...{ description: taskContributed5.type } },
    ]);
  });

  it("grabTasksByGroup - unexpected group required", async () => {
    mockFioriE2eCinfig.expects("getConfigDeployPickItems").never();
    expect(await __internal.grabTasksByGroup(tasks, roots[2], "unexpected")).to.be.empty;
  });

  it("grabTasksByGroup - [build/deploy] tasks found", async () => {
    mockFioriE2eCinfig.expects("getConfigDeployPickItems").resolves([]);
    expect(await __internal.grabTasksByGroup(tasks, roots[0])).to.be.deep.equal([
      { label: taskContributed1.__intent, kind: testVscode.QuickPickItemKind.Separator },
      {
        ...taskContributed1,
        ...{ description: taskContributed1.type },
        ...{ detail: taskContributed1.description },
      },
      { label: MISC, kind: testVscode.QuickPickItemKind.Separator },
      __internal.miscItem,
    ]);
  });

  it("grabTasksByGroup - [misc] tasks only", async () => {
    mockFioriE2eCinfig.expects("getConfigDeployPickItems").resolves([]);
    expect(await __internal.grabTasksByGroup(tasks, roots[1])).to.be.deep.equal([
      { label: MISC, kind: testVscode.QuickPickItemKind.Separator },
      __internal.miscItem,
    ]);
  });

  it("grabTasksByGroup - fioriE2ePickItems found, [build/deploy] tasks hidden", async () => {
    const e2eItem1 = { wsFolder: "folder-1", project: "project-1", type: e2EConfig.FIORI_DEPLOYMENT_CONFIG };
    const e2eItem2 = { wsFolder: "folder-2", project: "", type: e2EConfig.FIORI_DEPLOYMENT_CONFIG };
    mockFioriE2eCinfig.expects("getConfigDeployPickItems").resolves([e2eItem1, e2eItem2]);
    expect(await __internal.grabTasksByGroup(tasks, roots[0])).to.be.deep.equal([
      { label: "Fiori Configuration", kind: testVscode.QuickPickItemKind.Separator },
      { label: `Define Deployment parameters`, detail: `${e2eItem1.project}`, ...e2eItem1 },
      { label: `Define Deployment parameters`, detail: `${e2eItem2.wsFolder}`, ...e2eItem2 },
      { label: MISC, kind: testVscode.QuickPickItemKind.Separator },
      __internal.miscItem,
    ]);
  });

  it("grabMiscTasksByProject", async () => {
    expect(__internal.grabMiscTasksByProject(tasks, roots[1])).to.be.deep.equal([
      { ...taskNotContributed, ...{ description: taskNotContributed.type } },
      { ...taskContributed4, ...{ description: taskContributed4.type } },
    ]);
  });

  it("grabMiscTasksByProject - no items found", async () => {
    expect(__internal.grabMiscTasksByProject(tasks, roots[2])).to.be.empty;
  });
});
