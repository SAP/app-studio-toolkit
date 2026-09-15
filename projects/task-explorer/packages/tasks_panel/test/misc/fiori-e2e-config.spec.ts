import { expect } from "chai";
import { fail } from "assert";
import { mockVscode, testVscode } from "../utils/mockVSCode";

mockVscode("/src/fiori-e2e-config");
import { each, last } from "lodash";
import { SinonMock, SinonSandbox, createSandbox } from "sinon";
import { fioriE2eConfig, getFioriE2ePickItems } from "../../src/misc/fiori-e2e-config";
import { messages } from "../../src/i18n/messages";
import { DEFAULT_TARGET } from "@sap/cf-tools";
import * as cfUtils from "@sap/cf-tools/out/src/utils";
import * as cfTools from "@sap/cf-tools/out/src/cf-local";
import * as e2eConfig from "../../src/misc/e2e-config";
import * as path from "path";

describe("fiori-e2e-config scope", () => {
  let sandbox: SinonSandbox;
  let mockWorkspaceFs: SinonMock;
  let mockWorkspace: SinonMock;
  let mockCommands: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  beforeEach(() => {
    mockWorkspace = sandbox.mock(testVscode.workspace);
    mockWorkspaceFs = sandbox.mock(testVscode.workspace.fs);
    mockCommands = sandbox.mock(testVscode.commands);
  });

  afterEach(() => {
    mockWorkspace.verify();
    mockWorkspaceFs.verify();
    mockCommands.verify();
    sandbox.restore();
  });

  const ui5DeployYamlCf = `
# yaml-language-server
builder:
  customTasks:
  - name: something
  - name: other-zipper
    afterTask: generateCachebusterInfo
`;
  const ui5DeployYamlAbap = `
builder:
  customTasks:
  - name: deploy-to-abap
`;

  describe("getFioriE2ePickItems scope", () => {
    let mockExtensions: SinonMock;

    beforeEach(() => {
      mockExtensions = sandbox.mock(testVscode.extensions);
    });

    afterEach(() => {
      mockExtensions.verify();
    });

    const info: e2eConfig.ProjectInfo = {
      wsFolder: path.join(path.sep, "test", "projects"),
      project: "unit-test",
      style: e2eConfig.ProjTypes.FIORI_FE,
    };
    const uriUi5DeployYaml = testVscode.Uri.joinPath(
      testVscode.Uri.file(info.wsFolder),
      info.project,
      "ui5-deploy.yaml",
    );

    it("getFioriE2ePickItems - fiori tools generator command not registered", async () => {
      mockCommands.expects("getCommands").resolves([]);
      expect(await getFioriE2ePickItems(info)).to.be.undefined;
    });

    it("getFioriE2ePickItems - 'ui5-deploy.yaml' does not exist, config required", async () => {
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      mockWorkspaceFs.expects("stat").withExactArgs(uriUi5DeployYaml).rejects(new Error());
      expect(await getFioriE2ePickItems(info)).to.be.deep.equal({
        ...info,
        ...{ type: e2eConfig.FIORI_DEPLOYMENT_CONFIG },
      });
    });

    it("getFioriE2ePickItems - fiori project found, project relative path is empty (sigle root), 'ui5-deploy.yaml' does not exist, config required", async () => {
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      mockWorkspaceFs.expects("stat").withExactArgs(uriUi5DeployYaml).rejects(new Error());
      expect(await getFioriE2ePickItems(info)).to.be.deep.equal({
        ...info,
        ...{ type: e2eConfig.FIORI_DEPLOYMENT_CONFIG },
      });
    });

    it("getFioriE2ePickItems - fiori project found, 'ui5-deploy.yaml' exist but unsupported target", async () => {
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      mockWorkspaceFs.expects("stat").withExactArgs(uriUi5DeployYaml).resolves(true);
      const wrongUi5DeployYaml = `
    specVersion: '2.4'
    `;
      mockWorkspaceFs
        .expects("readFile")
        .withExactArgs(uriUi5DeployYaml)
        .resolves(Buffer.from(wrongUi5DeployYaml, `utf8`));
      expect(await getFioriE2ePickItems(info)).to.be.deep.equal({
        ...info,
        ...{ type: e2eConfig.FIORI_DEPLOYMENT_CONFIG },
      });
    });

    it("getFioriE2ePickItems - fiori project found, 'ui5-deploy.yaml' exist but empty", async () => {
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      mockWorkspaceFs.expects("stat").withExactArgs(uriUi5DeployYaml).resolves(true);
      const wrongUi5DeployYaml = ``;
      mockWorkspaceFs
        .expects("readFile")
        .withExactArgs(uriUi5DeployYaml)
        .resolves(Buffer.from(wrongUi5DeployYaml, `utf8`));
      expect(await getFioriE2ePickItems(info)).to.be.deep.equal({
        ...info,
        ...{ type: e2eConfig.FIORI_DEPLOYMENT_CONFIG },
      });
    });

    it("getFioriE2ePickItems - fiori project found, 'ui5-deploy.yaml' exist, target 'cf', config isn't required", async () => {
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      mockWorkspaceFs.expects("stat").withExactArgs(uriUi5DeployYaml).resolves(true);
      mockWorkspaceFs
        .expects("readFile")
        .withExactArgs(uriUi5DeployYaml)
        .resolves(Buffer.from(ui5DeployYamlCf, `utf8`));
      each(["ui5-deploy.yaml", "mta.yaml", "xs-app.json"], (_) => {
        mockWorkspaceFs
          .expects("stat")
          .withExactArgs(testVscode.Uri.joinPath(testVscode.Uri.file(info.wsFolder), info.project, _))
          .resolves(true);
      });
      expect(await getFioriE2ePickItems(info)).to.be.undefined;
    });

    it("getFioriE2ePickItems - fiori project found, 'ui5-deploy.yaml' exist, target 'cf', config is required (one of files isn't exists)", async () => {
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      mockWorkspaceFs.expects("stat").withExactArgs(uriUi5DeployYaml).resolves(true);
      mockWorkspaceFs
        .expects("readFile")
        .withExactArgs(uriUi5DeployYaml)
        .resolves(Buffer.from(ui5DeployYamlCf, `utf8`));
      each(["ui5-deploy.yaml", "mta.yaml", "xs-app.json"], (v, k) => {
        mockWorkspaceFs
          .expects("stat")
          .withExactArgs(testVscode.Uri.joinPath(testVscode.Uri.file(info.wsFolder), info.project, v))
          .resolves(k % 2 === 0);
      });
      expect(await getFioriE2ePickItems(info)).to.be.deep.equal({
        ...info,
        ...{ type: e2eConfig.FIORI_DEPLOYMENT_CONFIG },
      });
    });

    it("getFioriE2ePickItems - fiori project found, 'ui5-deploy.yaml' exist, target 'abap', config isn't required", async () => {
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      mockWorkspaceFs.expects("stat").withExactArgs(uriUi5DeployYaml).resolves(true);
      mockWorkspaceFs
        .expects("readFile")
        .withExactArgs(uriUi5DeployYaml)
        .resolves(Buffer.from(ui5DeployYamlAbap, `utf8`));
      each(["ui5-deploy.yaml"], (_) => {
        mockWorkspaceFs
          .expects("stat")
          .withExactArgs(testVscode.Uri.joinPath(testVscode.Uri.file(info.wsFolder), info.project, _))
          .resolves(true);
      });
      expect(await getFioriE2ePickItems(info)).to.be.undefined;
    });

    it("getFioriE2ePickItems - fiori project found, 'ui5-deploy.yaml' exist, target 'abap', config is required (one of files isn't exists)", async () => {
      mockCommands.expects("getCommands").resolves(["sap.ux.appGenerator.launchDeployConfig"]);
      mockWorkspaceFs.expects("stat").withExactArgs(uriUi5DeployYaml).resolves(true);
      mockWorkspaceFs
        .expects("readFile")
        .withExactArgs(uriUi5DeployYaml)
        .resolves(Buffer.from(ui5DeployYamlAbap, `utf8`));
      each(["ui5-deploy.yaml"], (v, k) => {
        mockWorkspaceFs
          .expects("stat")
          .withExactArgs(
            testVscode.Uri.joinPath(testVscode.Uri.joinPath(testVscode.Uri.file(info.wsFolder), info.project, v)),
          )
          .resolves(k % 2 !== 0);
      });
      expect(await getFioriE2ePickItems(info)).to.be.deep.equal({
        ...info,
        ...{ type: e2eConfig.FIORI_DEPLOYMENT_CONFIG },
      });
    });
  });

  describe("fioriE2eConfig scope", () => {
    const wsFolder = path.join(path.sep, "home", "test");
    const project = path.join(path.sep, "project");
    const uriUi5DeployYaml = testVscode.Uri.joinPath(testVscode.Uri.file(wsFolder), project, "ui5-deploy.yaml");

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

    let mockE2eConfig: SinonMock;

    beforeEach(() => {
      mockCommands
        .expects("executeCommand")
        .withExactArgs("sap.ux.appGenerator.launchDeployConfig", {
          fsPath: testVscode.Uri.joinPath(testVscode.Uri.file(wsFolder), project).fsPath,
        })
        .resolves();
      mockWorkspace
        .expects("createFileSystemWatcher")
        .withExactArgs(
          new testVscode.RelativePattern(wsFolder, path.join(path.sep, "project", "ui5-deploy.yaml")),
          false,
          false,
          true,
        )
        .returns(watcher);
      mockE2eConfig = sandbox.mock(e2eConfig);
    });

    afterEach(() => {
      mockE2eConfig.verify();
    });

    const data = { wsFolder, project };
    it("fioriE2eConfig, deploy.yaml is not updated - timeout reached", async () => {
      expect(await fioriE2eConfig(data)).to.be.undefined;
    }).timeout(6000);

    it("fioriE2eConfig, deploy.yaml is updated, target ABAP, task defined", async () => {
      setTimeout(() => {
        callbacks["change"]();
      });
      mockWorkspaceFs
        .expects("readFile")
        .withExactArgs(uriUi5DeployYaml)
        .resolves(Buffer.from(ui5DeployYamlAbap, `utf8`));
      mockE2eConfig.expects("addTaskDefinition").resolves();
      mockCommands.expects("executeCommand").withArgs("tasks-explorer.editTask").resolves();
      mockCommands.expects("executeCommand").withArgs("tasks-explorer.tree.select").resolves();
      await fioriE2eConfig(data);
      const tasks = (mockE2eConfig as any).expectations["addTaskDefinition"][0].args[0][1];
      expect(tasks.length).be.eq(1);
      // verify arg of `tasks-explorer.editTask` command
      expect((mockCommands as any).expectations["executeCommand"][1].args[0][1]).be.deep.equal(tasks[0]);
      // verify arg of `tasks-explorer.tree.select` command
      expect((mockCommands as any).expectations["executeCommand"][2].args[0][1]).be.deep.equal(tasks[0]);
      expect(/^Deploy to ABAP/.test((tasks[0] as any).label)).to.be.true;
      expect((tasks[0] as any).type).to.be.equal("npm");
      expect((tasks[0] as any).options).to.be.deep.equal({
        cwd: `${testVscode.Uri.joinPath(testVscode.Uri.file(wsFolder), project).fsPath}`,
      });
      expect((tasks[0] as any).script).to.be.equal("deploy");
    });

    it("fioriE2eConfig, deploy.yaml is updated, target CF, tasks defined", async () => {
      setTimeout(() => {
        callbacks["create"]();
      });
      mockWorkspaceFs
        .expects("readFile")
        .withExactArgs(uriUi5DeployYaml)
        .resolves(Buffer.from(ui5DeployYamlCf, `utf8`));
      mockE2eConfig.expects("addTaskDefinition").resolves();
      mockCommands.expects("executeCommand").withArgs("tasks-explorer.editTask").resolves();
      mockCommands.expects("executeCommand").withArgs("tasks-explorer.tree.select").resolves();
      await fioriE2eConfig(data);
      const tasks = (mockE2eConfig as any).expectations["addTaskDefinition"][0].args[0][1];
      expect(tasks.length).be.eq(2);
      // verify arg of `tasks-explorer.editTask` command
      expect((mockCommands as any).expectations["executeCommand"][1].args[0][1]).be.deep.equal(last(tasks));
      // verify arg of `tasks-explorer.tree.select` command
      expect((mockCommands as any).expectations["executeCommand"][2].args[0][1]).be.deep.equal(last(tasks));
      expect(/^Build/.test((tasks[0] as any).label)).to.be.true;
      expect((tasks[0] as any).type).to.be.equal("build.mta");
      expect((tasks[0] as any).taskType).to.be.equal("Build");
      expect((tasks[0] as any).projectPath).to.be.equal(
        testVscode.Uri.joinPath(testVscode.Uri.file(wsFolder), project).fsPath,
      );
      expect((tasks[0] as any).extensions).to.be.deep.equal([]);
      expect(/^Deploy to Cloud Foundry/.test((tasks[1] as any).label)).to.be.true;
      expect((tasks[1] as any).type).to.be.equal("deploy.mta.cf");
      expect((tasks[1] as any).taskType).to.be.equal("Deploy");
      expect((tasks[1] as any).mtarPath).to.be.equal(
        path.join(wsFolder, project, "mta_archives", `${project}_0.0.1.mtar`),
      );
      expect((tasks[1] as any).extensions).to.be.deep.equal([]);
      expect((tasks[1] as any).cfTarget).to.be.empty;
      expect((tasks[1] as any).cfEndpoint).to.be.empty;
      expect((tasks[1] as any).cfOrg).to.be.empty;
      expect((tasks[1] as any).cfSpace).to.be.empty;
      expect((tasks[1] as any).dependsOn).to.be.deep.equal([`${tasks[0].label}`]);
    });

    it("fioriE2eConfig, deploy.yaml is updated, target unexpected", async () => {
      setTimeout(() => {
        callbacks["delete"]();
      });
      mockWorkspaceFs.expects("readFile").withExactArgs(uriUi5DeployYaml).resolves(Buffer.from("", `utf8`));
      try {
        await fioriE2eConfig(data);
        fail("should fail");
      } catch (e: any) {
        expect(e.message).to.be.equal(messages.err_task_definition_unsupported_target);
      }
    });
  });

  describe("fioriE2eConfig scope - single root", () => {
    const wsFolder = path.join(path.sep, "home", "test", "my-project");
    const project = "";
    const uriUi5DeployYaml = testVscode.Uri.joinPath(testVscode.Uri.file(wsFolder), "ui5-deploy.yaml");
    const data = { wsFolder, project };

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

    const targets = [
      { label: "target1", isCurrent: false },
      { label: "target2", isCurrent: true },
    ];
    const currentTarget = { endPoint: "cur-end-point", org: "cur-org", space: "cur-space" };

    let mockCfTools: SinonMock;
    let mockCfUtils: SinonMock;
    let mockE2eConfig: SinonMock;

    beforeEach(() => {
      mockCommands
        .expects("executeCommand")
        .withExactArgs("sap.ux.appGenerator.launchDeployConfig", { fsPath: wsFolder })
        .resolves();
      mockWorkspace
        .expects("createFileSystemWatcher")
        .withExactArgs(new testVscode.RelativePattern(wsFolder, "ui5-deploy.yaml"), false, false, true)
        .returns(watcher);

      mockCfTools = sandbox.mock(cfTools);
      mockCfUtils = sandbox.mock(cfUtils);
      mockE2eConfig = sandbox.mock(e2eConfig);
      mockE2eConfig.expects("addTaskDefinition").resolves();
      mockCommands.expects("executeCommand").withArgs("tasks-explorer.editTask").resolves();
      mockCommands.expects("executeCommand").withArgs("tasks-explorer.tree.select").resolves();
    });

    afterEach(() => {
      mockCfTools.verify();
      mockE2eConfig.verify();
    });

    it("fioriE2eConfig, deploy.yaml is updated, target CF, tasks defined", async () => {
      setTimeout(() => {
        callbacks["create"]();
      });
      mockWorkspaceFs
        .expects("readFile")
        .withExactArgs(uriUi5DeployYaml)
        .resolves(Buffer.from(ui5DeployYamlCf, `utf8`));

      await fioriE2eConfig(data);
      const tasks = (mockE2eConfig as any).expectations["addTaskDefinition"][0].args[0][1];
      expect(tasks.length).be.eq(2);
      // verify arg of `tasks-explorer.editTask` command
      expect((mockCommands as any).expectations["executeCommand"][1].args[0][1]).be.deep.equal(last(tasks));
      // verify arg of `tasks-explorer.tree.select` command
      expect((mockCommands as any).expectations["executeCommand"][2].args[0][1]).be.deep.equal(last(tasks));
      expect(/^Build/.test((tasks[0] as any).label)).to.be.true;
      expect(/^Deploy to Cloud Foundry/.test((tasks[1] as any).label)).to.be.true;
    });

    it("fioriE2eConfig, deploy.yaml is updated, target CF, tasks defined, CF details obtained", async () => {
      setTimeout(() => {
        callbacks["create"]();
      });

      mockCfTools.expects("cfGetTargets").resolves(targets);
      mockCfUtils
        .expects("cfGetConfigFileField")
        .withExactArgs("Target", targets[1].label)
        .resolves(currentTarget.endPoint);
      mockCfUtils
        .expects("cfGetConfigFileField")
        .withExactArgs("OrganizationFields", targets[1].label)
        .resolves({ Name: currentTarget.org });
      mockCfUtils
        .expects("cfGetConfigFileField")
        .withExactArgs("SpaceFields", targets[1].label)
        .resolves({ Name: currentTarget.space });

      mockWorkspaceFs.expects("readFile").resolves(Buffer.from(ui5DeployYamlCf, `utf8`));

      await fioriE2eConfig(data);
      const tasks = (mockE2eConfig as any).expectations["addTaskDefinition"][0].args[0][1];
      expect(tasks.length).be.eq(2);

      expect((tasks[1] as any).cfTarget).to.be.equal(targets[1].label);
      expect((tasks[1] as any).cfEndpoint).to.be.equal(currentTarget.endPoint);
      expect((tasks[1] as any).cfOrg).to.be.equal(currentTarget.org);
      expect((tasks[1] as any).cfSpace).to.be.equal(currentTarget.space);
    });

    it("fioriE2eConfig, deploy.yaml is updated, target CF, tasks defined, no CF targets defined", async () => {
      setTimeout(() => {
        callbacks["create"]();
      });
      const targets = [{ label: DEFAULT_TARGET, isCurrent: true }];
      mockCfTools.expects("cfGetTargets").resolves(targets);
      mockCfUtils.expects("cfGetConfigFileField").never();

      mockWorkspaceFs.expects("readFile").resolves(Buffer.from(ui5DeployYamlCf, `utf8`));
      await fioriE2eConfig(data);
    });

    it("fioriE2eConfig, deploy.yaml is updated, target CF, tasks defined, no current CF targets defined", async () => {
      setTimeout(() => {
        callbacks["create"]();
      });

      mockCfTools.expects("cfGetTargets").resolves([
        { label: "target1", isCurrent: false },
        { label: "target2", isCurrent: false },
      ]);
      mockCfUtils.expects("cfGetConfigFileField").never();
      mockWorkspaceFs.expects("readFile").resolves(Buffer.from(ui5DeployYamlCf, `utf8`));
      await fioriE2eConfig(data);
    });

    it("fioriE2eConfig, deploy.yaml is updated, target CF, tasks defined, CF details obtained but not completed [org missed]", async () => {
      setTimeout(() => {
        callbacks["create"]();
      });

      mockCfTools.expects("cfGetTargets").resolves(targets);
      mockCfUtils
        .expects("cfGetConfigFileField")
        .withExactArgs("Target", targets[1].label)
        .resolves(currentTarget.endPoint);
      mockCfUtils
        .expects("cfGetConfigFileField")
        .withExactArgs("OrganizationFields", targets[1].label)
        .resolves(currentTarget.org);
      mockCfUtils
        .expects("cfGetConfigFileField")
        .withExactArgs("SpaceFields", targets[1].label)
        .resolves({ Name: currentTarget.space });

      mockWorkspaceFs.expects("readFile").resolves(Buffer.from(ui5DeployYamlCf, `utf8`));
      await fioriE2eConfig(data);
    });

    it("fioriE2eConfig, deploy.yaml is updated, target CF, tasks defined, CF details obtained but not completed [exception thrown]", async () => {
      setTimeout(() => {
        callbacks["create"]();
      });
      mockCfTools.expects("cfGetTargets").resolves(targets);
      mockCfUtils
        .expects("cfGetConfigFileField")
        .withExactArgs("Target", targets[1].label)
        .resolves(currentTarget.endPoint);
      mockCfUtils
        .expects("cfGetConfigFileField")
        .withExactArgs("OrganizationFields", targets[1].label)
        .rejects(new Error("no org"));
      mockCfUtils
        .expects("cfGetConfigFileField")
        .withExactArgs("SpaceFields", targets[1].label)
        .resolves({ label: currentTarget.space });

      mockWorkspaceFs.expects("readFile").resolves(Buffer.from(ui5DeployYamlCf, `utf8`));
      await fioriE2eConfig(data);
    });

    it("fioriE2eConfig, deploy.yaml is updated, target CF, tasks defined, CF details obtained but not completed [config format unexpected]", async () => {
      setTimeout(() => {
        callbacks["create"]();
      });
      mockCfTools.expects("cfGetTargets").resolves(targets);
      mockCfUtils.expects("cfGetConfigFileField").withExactArgs("Target", targets[1].label).resolves();
      mockCfUtils.expects("cfGetConfigFileField").withExactArgs("OrganizationFields", targets[1].label).resolves();
      mockCfUtils.expects("cfGetConfigFileField").withExactArgs("SpaceFields", targets[1].label).resolves();

      mockWorkspaceFs.expects("readFile").resolves(Buffer.from(ui5DeployYamlCf, `utf8`));
      await fioriE2eConfig(data);
    });
  });
});
