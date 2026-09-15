import { expect } from "chai";
import sinon = require("sinon");
import { MockApi, mockVscode, MockVSCodeInfo, testVscode } from "../utils/mockVSCode";
mockVscode("src/services/contributors");
import { Contributors } from "../../src/services/contributors";
import { ITaskTypeEventHandler } from "../../src/services/definitions";
import { messages } from "../../src/i18n/messages";
import { createLoggerWrapperMock, getLoggerMessage, resetLoggerMessage } from "../utils/loggerWrapperMock";

const tasksDefinition = {
  taskDefinitions: [
    {
      type: "test-deploy",
      properties: {
        label: {
          description: "Label",
        },
        taskType: {
          description: "Task Type",
        },
        transportPackage: {
          description: "Transport Package",
        },
      },
    },
  ],
};

describe("Contributors", () => {
  let sandbox: any;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- suppress
  let loggerWrapperMock: any;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    loggerWrapperMock = createLoggerWrapperMock(sandbox);
  });

  afterEach(() => {
    resetLoggerMessage();
    sandbox.restore();
  });

  it("getInstance", () => {
    const res = Contributors.getInstance();
    expect(res).not.empty;
    const anotherRes = Contributors.getInstance();
    expect(res).eq(anotherRes);
  });

  describe("init", () => {
    afterEach(() => {
      Contributors.getInstance()["tasksEditorContributorsMap"] = new Map<string, any>();
    });

    it("getTasksPropertyMessageMap = verify returning map structure/mapping", async () => {
      const packageJSON = {
        id: "test",
        contributes: {
          taskDefinitions: [
            {
              type: "type-1",
              required: ["label", "taskType"],
              properties: {
                label: {
                  description: "Task Name",
                },
                taskType: {
                  type: "string",
                  description: "Task Type",
                },
                extPath: {
                  type: "string",
                  description: "Path to the Extension File",
                },
              },
            },
            {
              type: "type-2",
              required: ["label", "taskType", "buildType"],
              properties: {
                label: {
                  description: "Task Name",
                },
                taskType: {
                  description: "Task Type",
                },
                buildType: {
                  type: "string",
                  description: "Build Type",
                },
              },
            },
          ],
        },
      };
      const messageMap = Contributors.getInstance()["getTasksPropertyMessageMap"](packageJSON);
      expect(messageMap).to.be.deep.equal({
        "type-1": {
          properties: {
            label: { description: "Task Name" },
            taskType: { description: "Task Type", type: "string" },
            extPath: { description: "Path to the Extension File", type: "string" },
          },
          requires: ["label", "taskType"],
        },
        "type-2": {
          properties: {
            label: { description: "Task Name" },
            taskType: { description: "Task Type" },
            buildType: { description: "Build Type", type: "string" },
          },
          requires: ["label", "taskType", "buildType"],
        },
      });
    });

    it("active extension exists that contributes to tasks explorer panel", async () => {
      testVscode.extensions.all = [
        {
          packageJSON: {
            id: "test",
            BASContributes: {
              tasksExplorer: [
                {
                  type: "test-deploy",
                  intent: "Deploy",
                },
              ],
            },
            contributes: tasksDefinition,
          },
          isActive: true,
          getApi: MockApi,
          exports: MockApi,
          extensionPath: "path",
        },
      ];
      const contributor = Contributors.getInstance();
      await contributor.init();
      expect(MockVSCodeInfo.visiblePanel).to.be.true;
      expect(contributor.getTaskPropertyDescription("test-deploy", "transportPackage")).to.eq("Transport Package");
    });

    it("active extension exists that contributes to tasks explorer panel; contribution entry misses task type", async () => {
      testVscode.extensions.all = [
        {
          packageJSON: {
            id: "test",
            BASContributes: {
              tasksExplorer: [{}],
            },
            contributes: tasksDefinition,
          },
          isActive: true,
          getApi: MockApi,
          exports: MockApi,
          extensionPath: "path",
        },
      ];
      const contributor = Contributors.getInstance();
      await contributor.init();
      expect(MockVSCodeInfo.visiblePanel).to.be.false;
    });

    it("inactive extension exists that contributes to tasks explorer panel", async () => {
      testVscode.extensions.all = [
        {
          packageJSON: {
            id: "test",
            name: "test",

            BASContributes: {
              tasksExplorer: [
                {
                  type: "test-deploy",
                  intent: "Deploy",
                },
              ],
            },
            contributes: tasksDefinition,
          },
          isActive: false,
          getApi: MockApi,
          activate: (): any => {
            return MockApi;
          },
          extensionPath: "path",
        },
      ];
      const contributor = Contributors.getInstance();
      const eventHandler = new MockTaskTypeEventHandler();
      contributor.registerEventHandler(eventHandler);
      await contributor.init();
      // wait to complete initialization async (*.onChange events triggers)
      await new Promise((resolve) => {
        setTimeout(() => resolve(true), 100);
      });
      expect(eventHandler.onChangeCalled).to.be.true;
      expect(MockVSCodeInfo.visiblePanel).to.be.true;
      const supportedIntents = contributor.getSupportedIntents();
      expect(supportedIntents.length).to.eq(1);
      expect(supportedIntents[0]).to.eq("Deploy");
      expect(contributor.getIntentByType("test-deploy")).to.eq("Deploy");
      expect(contributor.getIntentByType("unknown_type")).to.eq("other");
      expect(contributor.getExtensionNameByType("test-deploy")).to.eq("test");
      expect(contributor.getExtensionNameByType("test-unknown_type")).to.be.undefined;
      expect(contributor.getTaskEditorContributor("test-deploy")).to.exist;
      expect(contributor.getTaskEditorContributor("undefined-type")).not.exist;
      const supportedTypes = contributor.getSupportedTypes();
      expect(supportedTypes.length).to.eq(1);
      expect(supportedTypes[0]).to.eq("test-deploy");
    });

    it("inactive extension exists but its api not comply to the expected interface", async () => {
      testVscode.extensions.all = [
        {
          packageJSON: {
            id: "test",
            name: "test",

            BASContributes: {
              tasksExplorer: [
                {
                  type: "test-deploy",
                  intent: "Deploy",
                },
              ],
            },
            contributes: tasksDefinition,
          },
          isActive: false,
          getApi: MockApi,
          activate: (): any => {
            return { getTaskEditorContributors: true };
          },
          extensionPath: "path",
        },
      ];
      const contributor = Contributors.getInstance();
      const eventHandler = new MockTaskTypeEventHandler();
      contributor.registerEventHandler(eventHandler);
      await contributor.init();
      expect(MockVSCodeInfo.visiblePanel).to.be.false;
    });

    it("inactive extension exists but its api not comply to the expected interface (cont.)", async () => {
      testVscode.extensions.all = [
        {
          packageJSON: {
            id: "test",
            name: "test",

            BASContributes: {
              tasksExplorer: [
                {
                  type: "test-deploy",
                  intent: "Deploy",
                },
              ],
            },
            contributes: tasksDefinition,
          },
          isActive: false,
          getApi: MockApi,
          activate: (): any => {
            return;
          },
          extensionPath: "path",
        },
      ];
      const contributor = Contributors.getInstance();
      const eventHandler = new MockTaskTypeEventHandler();
      contributor.registerEventHandler(eventHandler);
      await contributor.init();
      expect(MockVSCodeInfo.visiblePanel).to.be.false;
    });

    it("inactive extension exists that contributes to tasks explorer panel; activate method fails", async () => {
      testVscode.extensions.all = [
        {
          packageJSON: {
            name: "test",
            publisher: "publisher",
            id: "test",
            BASContributes: {
              tasksExplorer: [
                {
                  type: "test-deploy",
                  intent: "Deploy",
                },
              ],
            },
            contributes: tasksDefinition,
          },
          isActive: false,
          getApi: MockApi,
          activate: (): any => {
            throw new Error("activation failed");
          },
          extensionPath: "path",
        },
      ];
      const contributor = Contributors.getInstance();
      await contributor.init();
      expect(MockVSCodeInfo.visiblePanel).to.be.false;
      expect(getLoggerMessage()).to.include(messages.ACTIVATE_CONTRIB_EXT_ERROR("publisher.test"));
    });

    it("inactive extension exists that doesn't contribute to tasks explorer panel; failing activate method is not called", async () => {
      testVscode.extensions.all = [
        {
          packageJSON: {
            name: "test",
            publisher: "publisher",
            id: "test",
            BASContributes: {
              tasksExplorer: [],
            },
            contributes: tasksDefinition,
          },
          isActive: false,
          getApi: MockApi,
          activate: (): any => {
            throw new Error("activation failed");
          },
          extensionPath: "path",
        },
      ];
      const contributor = Contributors.getInstance();
      await contributor.init();
      expect(MockVSCodeInfo.visiblePanel).to.be.false;
      expect(getLoggerMessage()).to.be.empty;
    });

    it("extension exists that contributes to tasks explorer panel, but misses BASContributes contribution point in package.json", async () => {
      testVscode.extensions.all = [
        {
          packageJSON: {
            id: "test",
            contributes: tasksDefinition,
          },
          isActive: false,
          getApi: MockApi,
          activate: (): any => {
            return MockApi;
          },
          extensionPath: "path",
        },
      ];
      const contributor = Contributors.getInstance();
      await contributor.init();
      expect(MockVSCodeInfo.visiblePanel).to.be.false;
    });

    it("extension exists that contributes to tasks explorer panel, but misses taskExplorer section in BASContributes contribution point", async () => {
      testVscode.extensions.all = [
        {
          packageJSON: {
            id: "test",
            BASContributes: {},
            contributes: tasksDefinition,
          },
          isActive: false,
          getApi: MockApi,
          activate: (): any => {
            return MockApi;
          },
          extensionPath: "path",
        },
      ];
      const contributor = Contributors.getInstance();
      await contributor.init();
      expect(MockVSCodeInfo.visiblePanel).to.be.false;
    });

    it("skips the multiple contributions of the same time, caches only the first one", async () => {
      testVscode.extensions.all = [
        {
          packageJSON: {
            id: "test",
            BASContributes: {
              tasksExplorer: [
                {
                  type: "test-deploy",
                  intent: "intent1",
                },
              ],
            },
            contributes: tasksDefinition,
          },
          isActive: true,
          getApi: MockApi,
          exports: MockApi,
          extensionPath: "path",
        },
        {
          packageJSON: {
            id: "test2",
            BASContributes: {
              tasksExplorer: [
                {
                  type: "test-deploy",
                  intent: "intent2",
                },
              ],
            },
            contributes: tasksDefinition,
          },
          isActive: true,
          getApi: MockApi,
          exports: MockApi,
          extensionPath: "path",
        },
      ];
      const contributor = Contributors.getInstance();
      await contributor.init();
      expect(contributor["tasksEditorContributorsMap"].get("test-deploy")["intent"]).to.eq("intent1");
    });
  });
});

class MockTaskTypeEventHandler implements ITaskTypeEventHandler {
  public onChangeCalled = false;

  onChange(): void {
    this.onChangeCalled = true;
  }
}
