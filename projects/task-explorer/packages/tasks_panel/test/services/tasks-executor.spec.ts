import { expect } from "chai";
import { fail } from "assert";
import { mockVscode, MockVSCodeInfo, resetTestVSCode, testVscode } from "../utils/mockVSCode";
mockVscode("src/services/tasks-executor");
import { executeVScodeTask, terminateVScodeTask } from "../../src/services/tasks-executor";
import { stub } from "sinon";
import { messages } from "../../src/i18n/messages";
import { serializeTask } from "../../src/utils/task-serializer";

describe("tasks executor - executeVScodeTask", () => {
  afterEach(() => {
    resetTestVSCode();
  });

  it("executed task is among fetched tasks -> executeTask is called", async () => {
    const myTask = { label: "aaa" };
    MockVSCodeInfo.allTasks = [{ name: "aaa", label: "aaa" }];
    await executeVScodeTask(myTask);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- suppress rule for test scope
    expect(MockVSCodeInfo.taskParam!.label).eq("aaa");
    expect(MockVSCodeInfo.executeCalled).true;
  });

  it("the executed task is not among the fetched tasks -> executeTask is not called ", async () => {
    const myTask = { label: "ccc" };
    MockVSCodeInfo.allTasks = [{ name: "aaa" }];
    await executeVScodeTask(myTask);
    expect(MockVSCodeInfo.executeCalled).false;
  });

  it("error is thrown during execution -> error message is shown", async () => {
    const myTask = { label: "aaa" };
    MockVSCodeInfo.allTasks = [{ name: "aaa" }];
    MockVSCodeInfo.fail = true;
    await executeVScodeTask(myTask);
    expect(MockVSCodeInfo.executeCalled).true;
    expect(MockVSCodeInfo.errorMsg).eq("test");
  });
});

describe("tasks executor - terminateVScodeTask", () => {
  afterEach(() => {
    resetTestVSCode();
  });

  it("executed task found -> terminateVScodeTask is called", async () => {
    const myTask = { label: "label" };
    let state = "running";
    const execution = {
      task: { name: "label" },
      terminate: () => {
        state = "stop";
      },
    };
    stub(testVscode.tasks, "taskExecutions").value([execution]);
    await terminateVScodeTask(myTask);
    expect(state).to.be.equal("stop");
  });

  it("executed task not found", async () => {
    const task: any = { label: "label" };
    stub(testVscode.tasks, "taskExecutions").value([{ task: { name: "name" } }]);
    try {
      await terminateVScodeTask(task);
      fail("should fail");
    } catch (e: any) {
      expect(e.message).to.be.equal(
        messages.TERMINATE_FAILURE(serializeTask(task), new Error(messages.TASK_NOT_FOUND(task.label)).toString()),
      );
    }
  });

  it("executed task found - termination failed", async () => {
    const task: any = { label: "label" };
    const error = new Error("runtime error");
    stub(testVscode.tasks, "taskExecutions").value([
      {
        task: { name: "label" },
        terminate: () => {
          throw error;
        },
      },
    ]);
    try {
      await terminateVScodeTask(task);
      fail("should fail");
    } catch (e: any) {
      expect(e.message).to.be.equal(messages.TERMINATE_FAILURE(serializeTask(task), error.toString()));
    }
  });
});
