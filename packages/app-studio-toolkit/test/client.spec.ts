import { SinonSandbox, SinonMock, createSandbox } from "sinon";
import { mockVscode } from "./mockUtil";

const testVscode = {
  ConfigurationTarget: {
    Workspace: 2,
  },
  workspace: {
    getConfiguration: () => "",
    onDidChangeWorkspaceFolders: () => {},
  },
};

mockVscode(testVscode, "dist/src/actions/client.js");
mockVscode(testVscode, "dist/src/actions/performer.js");
import { performAction } from "../src/actions/client";
import * as performer from "../src/actions/performer";
import { ICommandAction } from "@sap-devx/app-studio-toolkit-types";
import { COMMAND } from "../src/constants";

describe("client test", () => {
  let sandbox: SinonSandbox;
  let workspaceMock: SinonMock;
  let performerMock: SinonMock;
  let configMock: SinonMock;

  const config = {
    get: () => "",
    update: () => "",
  };

  const myAction: ICommandAction = {
    actionType: COMMAND,
    name: "myAction",
  };

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    performerMock = sandbox.mock(performer);
    workspaceMock = sandbox.mock(testVscode.workspace);
    configMock = sandbox.mock(config);
  });

  afterEach(() => {
    performerMock.verify();
    workspaceMock.verify();
    configMock.verify();
  });

  describe("perform action", () => {
    it("performs the action without schedule", async () => {
      performerMock.expects("_performAction").withExactArgs(myAction);
      await performAction(myAction);
    });

    it("schedules the action with schedule (existing action list, update successful)", async () => {
      const actions: any[] = [myAction, myAction];
      workspaceMock.expects("getConfiguration").returns(config);
      configMock.expects("get").withExactArgs("actions", []).returns(actions);
      configMock
        .expects("update")
        .withExactArgs("actions", [myAction, myAction, myAction], 2)
        .resolves();
      await performAction(myAction, { schedule: true });
    });

    it("schedules the action with schedule (empy action list, update successful)", async () => {
      workspaceMock.expects("getConfiguration").returns(config);
      configMock.expects("get").withExactArgs("actions", []).returns([]);
      configMock
        .expects("update")
        .withExactArgs("actions", [myAction], 2)
        .resolves();
      await performAction(myAction, { schedule: true });
    });

    it("schedules the action with schedule (existing action list, update rejected)", async () => {
      const actions: any[] = [myAction, myAction];
      workspaceMock.expects("getConfiguration").returns(config);
      configMock.expects("get").withExactArgs("actions", []).returns(actions);
      configMock
        .expects("update")
        .withExactArgs("actions", [myAction, myAction, myAction], 2)
        .rejects("Reasons!");
      await performAction(myAction, { schedule: true });
    });
  });
});
