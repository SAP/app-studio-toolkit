import { SinonMock, SinonSandbox, createSandbox } from "sinon";
import {
  ProjTypes,
  addTaskDefinition,
  areResourcesReady,
  collectProjects,
  generateMtaDeployTasks,
  doesFileExist,
  isTasksSettled,
  waitForFileResource,
  calculateTaskWsFolder,
} from "../../src/misc/e2e-config";
import { expect } from "chai";
import { MockVSCodeInfo, resetTestVSCode, testVscode } from "../utils/mockVSCode";
import * as utils from "../../src/utils/task-serializer";
import { afterEach } from "mocha";
import { concat, last, split } from "lodash";
import * as cfTools from "@sap/cf-tools/out/src/cf-local";
import * as path from "path";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";

describe("e2e-config scope", () => {
  let sandbox: SinonSandbox;
  let mockWorkspace: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  beforeEach(() => {
    mockWorkspace = sandbox.mock(testVscode.workspace);
  });

  afterEach(() => {
    mockWorkspace.verify();
    sandbox.restore();
    resetTestVSCode();
  });

  describe("waitForResource scope", () => {
    const callbacks = {};
    const watcher = {
      dispose: () => true,
      onDidChange: (c) => {
        callbacks["change"] = c;
      },
      onDidCreate: (r) => {
        callbacks["create"] = r;
      },
      onDidDelete: (d) => {
        callbacks["delete"] = d;
      },
    };

    const pattern = new testVscode.RelativePattern("base", "pattern");

    it("waitForResource - onDidChange callback triggered", async () => {
      mockWorkspace.expects("createFileSystemWatcher").withExactArgs(pattern, false, false, true).returns(watcher);
      setTimeout(() => callbacks["change"]());
      expect(await waitForFileResource(pattern, false, false, true)).to.be.true;
    });

    it("waitForResource - onDidCreate callback triggered", async () => {
      mockWorkspace.expects("createFileSystemWatcher").withExactArgs(pattern, false, false, false).returns(watcher);
      setTimeout(() => callbacks["create"]());
      expect(await waitForFileResource(pattern, false, false, false)).to.be.true;
    });

    it("waitForResource - onDidDelete callback triggered", async () => {
      mockWorkspace.expects("createFileSystemWatcher").withExactArgs(pattern, false, false, true).returns(watcher);
      setTimeout(() => callbacks["delete"]());
      expect(await waitForFileResource(pattern, false, false, true)).to.be.true;
    });
  });

  describe("areResourcesReady", () => {
    it("areResourcesReady - positive true", async () => {
      expect(
        await areResourcesReady([
          new Promise((resolve) => setTimeout(() => resolve(true), 100)),
          new Promise((resolve) => setTimeout(() => resolve(true), 200)),
        ]),
      ).be.true;
    });

    it("areResourcesReady - positive false", async () => {
      expect(
        await areResourcesReady(
          [
            new Promise((resolve) => setTimeout(() => resolve(true), 100)),
            new Promise((resolve) => setTimeout(() => resolve(false), 200)),
          ],
          1,
        ),
      ).be.false;
    });

    it("areResourcesReady - timeout occured", async () => {
      expect(
        await areResourcesReady(
          [
            new Promise((resolve) => setTimeout(() => resolve(true), 500)),
            new Promise((resolve) => setTimeout(() => resolve(true), 500)),
          ],
          0.3,
        ),
      ).be.false;
    });
  });

  describe("collectProjects", () => {
    const wsFolder = path.join(path.sep, "home", "user", "test");
    const projectInfo = {
      path: testVscode.Uri.joinPath(testVscode.Uri.file(wsFolder), "project").path,
      type: "com.sap.fe",
    };
    const infoProject = {
      getProjectInfo: () => Promise.resolve(projectInfo),
    };
    const btaExtension = {
      exports: {
        workspaceAPI: {
          getProjects: (): Promise<any> => Promise.resolve([]),
        },
      },
    };
    let mockExtensions: SinonMock;
    beforeEach(() => {
      mockExtensions = sandbox.mock(testVscode.extensions);
    });

    afterEach(() => {
      mockExtensions.verify();
    });

    it("collectProjects - toolkit extension is not configured well", async () => {
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns({
        exports: null,
      });
      expect(await collectProjects(wsFolder)).to.be.deep.equal([]);
    });

    it("collectProjects - toolkit extension is not configured well (cont.)", async () => {
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(undefined);
      expect(await collectProjects(wsFolder, true)).to.be.deep.equal([]);
    });

    it("collectProjects - no project found", async () => {
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      expect(await collectProjects(wsFolder, true)).to.be.deep.equal([]);
    });

    it("collectProjects - project found, projectInfo undefined", async () => {
      sandbox.stub(infoProject, "getProjectInfo").resolves();
      sandbox.stub(btaExtension.exports.workspaceAPI, "getProjects").resolves([infoProject]);
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      expect(await collectProjects(wsFolder, true)).to.be.deep.equal([]);
    });

    it("collectProjects - project found, but the project doesn't match the requested path", async () => {
      sandbox.stub(btaExtension.exports.workspaceAPI, "getProjects").resolves([infoProject]);
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      mockWorkspace
        .expects("getWorkspaceFolder")
        .withExactArgs(testVscode.Uri.file(projectInfo.path))
        .returns({ uri: testVscode.Uri.file(path.join(path.sep, "home", "user", "test1")) });
      expect(await collectProjects(wsFolder, true)).to.be.deep.equal([]);
    });

    it("collectProjects - project found, related workspace folder doesn't exist", async () => {
      sandbox.stub(btaExtension.exports.workspaceAPI, "getProjects").resolves([infoProject]);
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      mockWorkspace
        .expects("getWorkspaceFolder")
        .withExactArgs(testVscode.Uri.file(projectInfo.path))
        .returns(undefined);
      expect(await collectProjects(wsFolder, true)).to.be.deep.equal([]);
    });

    it("collectProjects - project found, but the project type does not match the 'com.sap.fe' type", async () => {
      sandbox.stub(infoProject, "getProjectInfo").resolves({
        path: path.join(path.sep, "home", "user", "test", "project"),
        type: "com.sap.cap.js",
      });
      sandbox.stub(btaExtension.exports.workspaceAPI, "getProjects").resolves([infoProject]);
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      mockWorkspace
        .expects("getWorkspaceFolder")
        .withExactArgs(testVscode.Uri.file(projectInfo.path))
        .returns({ uri: testVscode.Uri.file(path.join(path.sep, "home", "user", "test")) });
      expect(await collectProjects(wsFolder, true)).to.be.deep.equal([]);
    });

    it("collectProjects - project found, project type is 'com.sap.fe' type", async () => {
      sandbox.stub(infoProject, "getProjectInfo").resolves({
        path: path.join(path.sep, "home", "user", "test", "project"),
        type: "com.sap.fe",
      });
      sandbox.stub(btaExtension.exports.workspaceAPI, "getProjects").resolves([infoProject]);
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      mockWorkspace
        .expects("getWorkspaceFolder")
        .withExactArgs(testVscode.Uri.file(projectInfo.path))
        .returns({ uri: testVscode.Uri.file(path.join(path.sep, "home", "user", "test", path.sep)) });
      expect(await collectProjects(wsFolder, true)).to.be.deep.equal([
        {
          wsFolder,
          project: "project",
          style: ProjTypes.FIORI_FE,
        },
      ]);
    });

    it("collectProjects - project opened as a root, project type is 'com.sap.fe' type", async () => {
      const folder = path.join(path.sep, "home", "user", "test");
      sandbox.stub(infoProject, "getProjectInfo").resolves({
        path: folder,
        type: "com.sap.fe",
      });
      sandbox.stub(btaExtension.exports.workspaceAPI, "getProjects").resolves([infoProject]);
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      mockWorkspace.expects("asRelativePath").withExactArgs(folder, false).returns(folder);
      mockWorkspace
        .expects("getWorkspaceFolder")
        .withExactArgs(testVscode.Uri.file(folder))
        .returns({ uri: testVscode.Uri.file(folder, path.sep) });
      expect(await collectProjects(wsFolder, true)).to.be.deep.equal([
        {
          wsFolder,
          project: "",
          style: ProjTypes.FIORI_FE,
        },
      ]);
    });

    it("collectProjects - project found, project type is 'com.sap.cap' type", async () => {
      const projectInfo = {
        path: testVscode.Uri.joinPath(testVscode.Uri.file(wsFolder), "project", "my").path,
        type: "com.sap.cap",
      };
      sandbox.stub(infoProject, "getProjectInfo").resolves(projectInfo);
      sandbox.stub(btaExtension.exports.workspaceAPI, "getProjects").resolves([infoProject]);
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      mockWorkspace
        .expects("getWorkspaceFolder")
        .withExactArgs(testVscode.Uri.file(projectInfo.path))
        .returns({ uri: testVscode.Uri.file(path.join(path.sep, "home", "user", "test", path.sep)) });
      expect(await collectProjects(wsFolder, true)).to.be.deep.equal([
        {
          wsFolder,
          project: "my",
          style: ProjTypes.CAP,
        },
      ]);
    });

    it("collectProjects - project found, project type is 'com.sap.cap.java' type", async () => {
      const projectInfo = {
        path: testVscode.Uri.joinPath(testVscode.Uri.file(wsFolder), "project", "my").path,
        type: "com.sap.cap.java",
      };
      sandbox.stub(infoProject, "getProjectInfo").resolves(projectInfo);
      sandbox.stub(btaExtension.exports.workspaceAPI, "getProjects").resolves([infoProject]);
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      mockWorkspace
        .expects("getWorkspaceFolder")
        .withExactArgs(testVscode.Uri.file(projectInfo.path))
        .returns({ uri: testVscode.Uri.file(path.join(path.sep, "home", "user", "test", path.sep)) });
      expect(await collectProjects(wsFolder, true)).to.be.deep.equal([
        {
          wsFolder,
          project: "my",
          style: ProjTypes.CAP,
        },
      ]);
    });

    it("collectProjects - project found, project type is 'com.sap.hana' type", async () => {
      const wsFolder = path.join(path.sep, "home", "user", "test", "project", "my");
      const projectInfo = {
        path: testVscode.Uri.joinPath(testVscode.Uri.file(wsFolder), "proj").path,
        type: "com.sap.hana",
      };
      sandbox.stub(infoProject, "getProjectInfo").resolves(projectInfo);
      sandbox.stub(btaExtension.exports.workspaceAPI, "getProjects").resolves([infoProject]);
      mockExtensions.expects("getExtension").withExactArgs("SAPOSS.app-studio-toolkit").returns(btaExtension);
      mockWorkspace
        .expects("getWorkspaceFolder")
        .withExactArgs(testVscode.Uri.file(projectInfo.path))
        .returns({ uri: testVscode.Uri.file(`${wsFolder}/`) });
      mockWorkspace.expects("asRelativePath").withExactArgs(projectInfo.path, false).returns("proj");
      expect(await collectProjects(wsFolder, true)).to.be.deep.equal([
        {
          wsFolder,
          project: "proj",
          style: ProjTypes.HANA,
        },
      ]);
    });
  });

  describe("addTaskDefinition scope", () => {
    const wsFolder = path.join(path.sep, "home", "user", "test", "project", "my", path.sep);

    let mockUpdateConfiguration: SinonMock;
    beforeEach(() => {
      mockUpdateConfiguration = sandbox.mock(utils);
      mockUpdateConfiguration.expects("updateTasksConfiguration").withArgs(wsFolder).resolves();
    });

    afterEach(() => {
      mockUpdateConfiguration.verify();
    });

    const tasks = [
      {
        label: "task1",
        type: "type1",
        __wsFolder: wsFolder,
      },
      {
        label: "task2",
        type: "type2",
        __wsFolder: wsFolder,
      },
    ];
    it("addTaskDefinition - get `tasks` returns `undefined`", async () => {
      mockWorkspace
        .expects("getConfiguration")
        .withExactArgs("tasks", testVscode.Uri.file(wsFolder))
        .returns(undefined);
      await addTaskDefinition(wsFolder, tasks);
      const _tasks = (<any>mockUpdateConfiguration).expectations["updateTasksConfiguration"][0].args[0][1];
      expect(_tasks).be.deep.equal(tasks);
    });

    it("addTaskDefinition - update the existing tasks list", async () => {
      const exisTasks = [{ label: "task3", type: "other" }];
      mockWorkspace
        .expects("getConfiguration")
        .withExactArgs("tasks", testVscode.Uri.file(wsFolder))
        .returns({ get: () => exisTasks });
      await addTaskDefinition(wsFolder, tasks);
      const _tasks = (<any>mockUpdateConfiguration).expectations["updateTasksConfiguration"][0].args[0][1];
      expect(_tasks).be.deep.equal(concat(exisTasks, tasks));
    });
  });

  describe("isFileExist scope", () => {
    const url = testVscode.Uri.file(path.join(path.sep, "home", "user", "test", "project", "my", "file.txt"));

    let mockWorkspaceFs: SinonMock;
    beforeEach(() => {
      mockWorkspaceFs = sandbox.mock(testVscode.workspace.fs);
    });

    afterEach(() => {
      mockWorkspaceFs.verify();
    });

    it("isFileExist - does exist", async () => {
      mockWorkspaceFs.expects("stat").withExactArgs(url).resolves({ type: testVscode.FileType.File });
      expect(await doesFileExist(url)).be.true;
    });

    it("isFileExist - does NOT exist", async () => {
      mockWorkspaceFs.expects("stat").withExactArgs(url).rejects(new Error("File not found"));
      expect(await doesFileExist(url)).be.false;
    });
  });

  describe("generateMtaDeployTasks scope", () => {
    const wsFolder = path.join(path.sep, "home", "user", "test", "project", path.sep);
    const project = "my";

    let mockCfTools: SinonMock;
    beforeEach(() => {
      mockCfTools = sandbox.mock(cfTools);
    });

    afterEach(() => {
      mockCfTools.verify();
    });

    const projectUri = testVscode.Uri.joinPath(testVscode.Uri.file(wsFolder), project);
    const taskBuild = {
      label: `Build ${project}`,
      type: "build.mta",
      taskType: "Build",
      projectPath: `${projectUri.fsPath}`,
      extensions: [],
    };
    const taskDeploy = {
      type: "deploy.mta.cf",
      label: `Deploy to Cloud Foundry ${project}`,
      taskType: "Deploy",
      mtarPath: path.join(
        projectUri.fsPath,
        "mta_archives",
        `${project || last(split(wsFolder, path.sep))}_0.0.1.mtar`,
      ),
      extensions: [],
      dependsOn: [`${taskBuild.label}`],
    };
    it("generateMtaDeployTasks - no cf target defined", async () => {
      mockCfTools.expects("cfGetTargets").resolves([]);
      expect(await generateMtaDeployTasks(wsFolder, project)).be.deep.equal([
        taskBuild,
        { ...taskDeploy, ...{ cfTarget: "", cfEndpoint: "", cfOrg: "", cfSpace: "" } },
      ]);
    });

    it("generateMtaDeployTasks - no cf current target found", async () => {
      mockCfTools.expects("cfGetTargets").resolves([{ label: "target1" }]);
      expect(await generateMtaDeployTasks(wsFolder, project)).be.deep.equal([
        taskBuild,
        { ...taskDeploy, ...{ cfTarget: "", cfEndpoint: "", cfOrg: "", cfSpace: "" } },
      ]);
    });

    it("generateMtaDeployTasks - cf target found", async () => {
      const targetName = "target2";
      mockCfTools.expects("cfGetTargets").resolves([{ label: targetName, isCurrent: true }]);
      expect(await generateMtaDeployTasks(wsFolder, project)).be.deep.equal([
        taskBuild,
        { ...taskDeploy, ...{ cfTarget: targetName, cfEndpoint: "", cfOrg: "", cfSpace: "" } },
      ]);
    });

    it("generateMtaDeployTasks - sequence label type, cf target found", async () => {
      const targetName = "target3";
      mockCfTools.expects("cfGetTargets").resolves([{ label: targetName, isCurrent: true }]);
      const copyTaskBuild = { ...taskBuild };
      copyTaskBuild.label = `Build `;
      const copyTaskDeploy = { ...taskDeploy };
      copyTaskDeploy.label = `Deploy to Cloud Foundry `;
      copyTaskDeploy.dependsOn = [copyTaskBuild.label];
      expect(await generateMtaDeployTasks(wsFolder, "", "sequence")).be.deep.equal([
        { ...copyTaskBuild, ...{ projectPath: `${wsFolder}` } },
        {
          ...copyTaskDeploy,
          ...{ cfTarget: targetName, cfEndpoint: "", cfOrg: "", cfSpace: "" },
          ...{ mtarPath: path.normalize(path.join(wsFolder, "mta_archives", "project_0.0.1.mtar")) },
        },
      ]);
    });
  });

  describe("isTasksSettled scope", () => {
    const wsFolder = path.join(path.sep, "home", "user", "test", "project", "my");
    const wsFolderPath = testVscode.Uri.file(wsFolder);

    it("isTasksSettled - exists", async () => {
      const tasks = [
        { label: "task1", type: "type1" },
        { label: "task2", type: "type2" },
      ];
      MockVSCodeInfo.configTasks?.set(wsFolderPath.path, tasks);
      expect(isTasksSettled(wsFolder, tasks)).be.true;
    });

    it("isTasksSettled - exists, matched", async () => {
      const tasks = [
        { label: "task1", type: "type1" },
        { label: "task2", type: "type2" },
      ];
      MockVSCodeInfo.configTasks?.set(wsFolderPath.path, [
        { label: "task1", type: "type1", path: "style1" },
        { label: "task2", type: "type2", path: "style2" },
      ]);
      expect(isTasksSettled(wsFolder, tasks)).be.true;
    });

    it("isTasksSettled - partly exists", async () => {
      const tasks = [
        { label: "task1", type: "type1" },
        { label: "task2", type: "type2" },
      ];
      MockVSCodeInfo.configTasks?.set(wsFolderPath.path, [{ label: "task2", type: "type2" }]);
      expect(isTasksSettled(wsFolder, tasks)).be.false;
    });

    it("isTasksSettled - not exists", async () => {
      const tasks = [
        { label: "task1", type: "type1" },
        { label: "task2", type: "type2" },
      ];
      MockVSCodeInfo.configTasks?.set(wsFolderPath.path, [
        { label: "task3", type: "type3" },
        { label: "task4", type: "type4" },
      ]);
      expect(isTasksSettled(wsFolder, tasks)).be.false;
    });

    it("isTasksSettled - config empty", async () => {
      const tasks = [
        { label: "task1", type: "type1" },
        { label: "task2", type: "type2" },
      ];
      MockVSCodeInfo.configTasks = undefined;
      expect(isTasksSettled(wsFolder, tasks)).be.false;
    });
  });

  describe("calculateTaskWsFolder scope", () => {
    const baseTask: ConfiguredTask = {
      label: "task",
      type: "npm",
      __wsFolder: path.join(path.sep, "root", "project"),
    };

    it("task type - 'npm', 'path' property found", async () => {
      const task: ConfiguredTask = {
        ...baseTask,
        ...{
          type: "npm",
          path: path.join(path.sep, "root", "project", "test-path"),
        },
      };
      expect(calculateTaskWsFolder(task)).be.equal(path.join(task.__wsFolder, "test-path"));
    });

    it("task type - 'npm', 'options.cwd' property found", async () => {
      const task: ConfiguredTask = {
        ...baseTask,
        ...{
          type: "npm",
          options: {
            cwd: path.join(path.sep, "root", "project", "test-path"),
          },
        },
      };
      expect(calculateTaskWsFolder(task)).be.equal(path.join(task.__wsFolder, "test-path"));
    });

    it("task type - 'npm', 'options.cwd' property not found", async () => {
      const task: ConfiguredTask = {
        ...baseTask,
        ...{
          type: "npm",
          opt: {
            pwd: path.join(path.sep, "root", "project", "test-path"),
          },
        },
      };
      expect(calculateTaskWsFolder(task)).be.equal(path.join(task.__wsFolder, ""));
    });

    it("task type - 'npm', 'options.cwd' property undefined", async () => {
      const task: ConfiguredTask = {
        ...baseTask,
        ...{
          type: "npm",
          options: {
            cwd: undefined,
          },
        },
      };
      expect(calculateTaskWsFolder(task)).be.equal(path.join(task.__wsFolder, ""));
    });

    it("task type - 'build.mta'", async () => {
      const task: ConfiguredTask = {
        ...baseTask,
        ...{
          type: "build.mta",
          projectPath: path.join(path.sep, "root", "project", "test-path"),
        },
      };
      expect(calculateTaskWsFolder(task)).be.equal(path.join(task.__wsFolder, "test-path"));
    });

    it("task type - 'deploy.mta.cf'", async () => {
      const task: ConfiguredTask = {
        ...baseTask,
        ...{
          type: "build.mta.cf",
          mtarPath: path.join(path.sep, "root", "project", "test-path", "mta_archives", "test.mtar"),
        },
      };
      expect(calculateTaskWsFolder(task)).be.equal(
        path.join(task.__wsFolder, "test-path", "mta_archives", "test.mtar"),
      );
    });

    it("task type - 'deploy.mta.cf', path value is relative", async () => {
      const task: ConfiguredTask = {
        ...baseTask,
        ...{
          type: "build.mta.cf",
          mtarPath: path.join("test-path", "mta_archives", "test.mtar"),
        },
      };
      expect(calculateTaskWsFolder(task)).be.equal(
        path.join(task.__wsFolder, "test-path", "mta_archives", "test.mtar"),
      );
    });

    it("task type - 'deploy.mta.cf', expected property not exists", async () => {
      const task: ConfiguredTask = {
        ...baseTask,
        ...{ type: "build.mta.cf" },
      };
      expect(calculateTaskWsFolder(task)).be.equal(path.join(task.__wsFolder));
    });

    it("task type - 'deploy'", async () => {
      const task: ConfiguredTask = {
        ...baseTask,
        ...{
          type: "deploy",
          projectPath: path.join(path.sep, "root", "project", "test-path"),
        },
      };
      expect(calculateTaskWsFolder(task)).be.equal(path.join(task.__wsFolder, "test-path"));
    });

    it("task type - 'npm-script'", async () => {
      const task: ConfiguredTask = {
        ...baseTask,
        ...{
          type: "npm-script",
          packageJSONPath: path.join(path.sep, "root", "project", "test-path"),
        },
      };
      expect(calculateTaskWsFolder(task)).be.equal(path.join(task.__wsFolder, "test-path"));
    });

    it("task type - 'npm-script', expected property not exists", async () => {
      const task: ConfiguredTask = {
        ...baseTask,
        ...{ type: "npm-script" },
      };
      expect(calculateTaskWsFolder(task)).be.equal(path.join(task.__wsFolder, ""));
    });

    it("task type - 'unknown'", async () => {
      const task: ConfiguredTask = {
        ...baseTask,
        ...{ type: "unknown" },
      };
      expect(calculateTaskWsFolder(task)).be.equal(path.join(task.__wsFolder, ""));
    });
  });
});
