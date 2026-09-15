import { expect } from "chai";
import { extend, find, map } from "lodash";
import { mockVscode, resetTestVSCode, testVscode, MockVSCodeInfo } from "../utils/mockVSCode";

mockVscode("/src/cap-e2e-config");
import { SinonMock, SinonSandbox, createSandbox } from "sinon";
import * as childProcess from "child_process";
import * as e2eConfig from "../../src/misc/e2e-config";
import { capE2eConfig, getCapE2ePickItems } from "../../src/misc/cap-e2e-config";
import { EventEmitter } from "ws";

describe("cap-e2e-config scope", () => {
  let sandbox: SinonSandbox;
  let mockWorkspace: SinonMock;
  let mockCommands: SinonMock;

  let fakeSpawnEventEmitter;

  before(() => {
    sandbox = createSandbox();
  });

  beforeEach(() => {
    mockWorkspace = sandbox.mock(testVscode.workspace);
    mockCommands = sandbox.mock(testVscode.commands);

    fakeSpawnEventEmitter = new EventEmitter() as childProcess.ChildProcessWithoutNullStreams;
    (<any>fakeSpawnEventEmitter).stdout = new EventEmitter();
    (<any>fakeSpawnEventEmitter).stderr = new EventEmitter();
  });

  afterEach(() => {
    mockWorkspace.verify();
    mockCommands.verify();
    sandbox.restore();
    resetTestVSCode();
  });

  describe("getCapE2ePickItems scope", () => {
    const info = {
      wsFolder: "ws-folder",
      project: "project",
      style: e2eConfig.ProjTypes.CAP,
    };

    it("getCapE2ePickItems - unexpected type", async () => {
      expect(await getCapE2ePickItems(extend({}, info, { style: e2eConfig.ProjTypes.LCAP }))).to.be.undefined;
    });

    it("getCapE2ePickItems - cds not enabled", async () => {
      expect(await getCapE2ePickItems(info)).to.be.undefined;
    });

    it("getCapE2ePickItems - cds not enabled: 'spawn' unexpected exit", async () => {
      sandbox
        .stub(childProcess, "spawn")
        .withArgs("cds", ["help"], { cwd: info.wsFolder })
        .returns(fakeSpawnEventEmitter);
      setTimeout(() => fakeSpawnEventEmitter.stdout.emit("data", "cds help"));
      setTimeout(() => fakeSpawnEventEmitter.emit("exit", 2), 100);
      expect(await getCapE2ePickItems(info)).to.be.undefined;
    });

    it("getCapE2ePickItems - cds not enabled: 'spawn' triggered error 'data' callback and exit with error", async () => {
      sandbox
        .stub(childProcess, "spawn")
        .withArgs("cds", ["help"], { cwd: info.wsFolder })
        .returns(fakeSpawnEventEmitter);
      setTimeout(() => fakeSpawnEventEmitter.stderr.emit("data", "unrecognised command cds help"));
      setTimeout(() => fakeSpawnEventEmitter.emit("exit", 1), 100);
      expect(await getCapE2ePickItems(info)).to.be.undefined;
    });

    it("getCapE2ePickItems - cds enabled, project not configured", async () => {
      sandbox
        .stub(childProcess, "spawn")
        .withArgs("cds", ["help"], { cwd: info.wsFolder })
        .returns(fakeSpawnEventEmitter);
      setTimeout(() => fakeSpawnEventEmitter.emit("exit", 0));
      expect(await getCapE2ePickItems(info)).to.be.deep.equal({
        ...info,
        ...{ type: e2eConfig.CAP_DEPLOYMENT_CONFIG },
      });
    });

    it("getCapE2ePickItems - cds enabled, project configured", async () => {
      sandbox
        .stub(childProcess, "spawn")
        .withArgs("cds", ["help"], { cwd: info.wsFolder })
        .returns(fakeSpawnEventEmitter);
      setTimeout(() => fakeSpawnEventEmitter.emit("exit", 0));
      const mtaFile = testVscode.Uri.joinPath(testVscode.Uri.file(info.wsFolder), info.project, "mta.yaml");
      sandbox.stub(e2eConfig, "doesFileExist").withArgs(mtaFile).resolves(true);
      const tasks = map(await e2eConfig.generateMtaDeployTasks(info.wsFolder, info.project, "sequence"), (task) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- object destructuring is used to exclude the specified properties
        const { ["label"]: excludedLabel, ["dependsOn"]: excludedDependsOn, ...copyTask } = task;
        return copyTask;
      });
      sandbox.stub(e2eConfig, "isTasksSettled").withArgs(info.wsFolder, tasks).returns(true);
      expect(await getCapE2ePickItems(info)).to.be.undefined;
    });

    it("getCapE2ePickItems - cds enabled, project not configured (tasks not exist)", async () => {
      sandbox
        .stub(childProcess, "spawn")
        .withArgs("cds", ["help"], { cwd: info.wsFolder })
        .returns(fakeSpawnEventEmitter);
      setTimeout(() => fakeSpawnEventEmitter.emit("exit", 0));
      const mtaFile = testVscode.Uri.joinPath(testVscode.Uri.file(info.wsFolder), info.project, "mta.yaml");
      sandbox.stub(e2eConfig, "doesFileExist").withArgs(mtaFile).resolves(true);
      sandbox.stub(e2eConfig, "isTasksSettled").returns(false);
      expect(await getCapE2ePickItems(info)).to.be.deep.equal({
        ...info,
        ...{ type: e2eConfig.CAP_DEPLOYMENT_CONFIG },
      });
    });
  });

  describe("capE2eConfig scope", () => {
    const data = {
      wsFolder: "ws-folder",
      project: "project",
    };

    const mtaFile = testVscode.Uri.joinPath(testVscode.Uri.file(data.wsFolder), data.project, "mta.yaml");

    it("capE2eConfig - succeed, tasks added", async () => {
      sandbox.stub(e2eConfig, "doesFileExist").withArgs(mtaFile).resolves(false);
      sandbox
        .stub(e2eConfig, "waitForFileResource")
        .withArgs(
          new testVscode.RelativePattern(data.wsFolder, `${data.project ? `${data.project}/` : ``}mta.yaml`),
          false,
          false,
          true,
        )
        .resolves(true);
      sandbox
        .stub(childProcess, "spawn")
        .withArgs("cds", ["add", "mta"], {
          cwd: testVscode.Uri.joinPath(testVscode.Uri.file(data.wsFolder), data.project).fsPath,
        })
        .returns(fakeSpawnEventEmitter);
      setTimeout(() => fakeSpawnEventEmitter.emit("exit", 0), 100);

      const tasks = await e2eConfig.generateMtaDeployTasks(data.wsFolder, data.project, "sequence");
      mockCommands.expects("executeCommand").withExactArgs("tasks-explorer.editTask", tasks[1]).once().resolves();
      mockCommands.expects("executeCommand").withExactArgs("tasks-explorer.tree.select", tasks[1]).once().resolves();
      expect(await capE2eConfig(data)).to.be.undefined;
      const _configuredTasks = MockVSCodeInfo.configTasks?.get(data.wsFolder);
      expect(find(_configuredTasks, { label: tasks[0].label })).to.exist;
      expect(find(_configuredTasks, { label: tasks[1].label })).to.exist;
    });

    it("capE2eConfig - not configured, `mta` not created", async () => {
      const copyData = { ...data, ...{ project: "" } };
      sandbox.stub(e2eConfig, "doesFileExist").withArgs(mtaFile).resolves(false);
      sandbox
        .stub(e2eConfig, "waitForFileResource")
        .withArgs(new testVscode.RelativePattern(copyData.wsFolder, `mta.yaml`), false, false, true)
        .resolves(false);
      sandbox
        .stub(childProcess, "spawn")
        .withArgs("cds", ["add", "mta"], {
          cwd: testVscode.Uri.joinPath(testVscode.Uri.file(copyData.wsFolder), copyData.project).fsPath,
        })
        .returns(fakeSpawnEventEmitter);
      setTimeout(() => fakeSpawnEventEmitter.emit("exit", 0), 100);
      expect(await capE2eConfig(copyData)).to.be.undefined;
    });

    it("capE2eConfig - project configured, tasks not added", async () => {
      sandbox.stub(e2eConfig, "doesFileExist").withArgs(mtaFile).resolves(true);
      mockCommands.expects("executeCommand").withArgs("tasks-explorer.editTask").once().resolves();
      mockCommands.expects("executeCommand").withArgs("tasks-explorer.tree.select").once().resolves();
      await capE2eConfig(data);
    });
  });
});
