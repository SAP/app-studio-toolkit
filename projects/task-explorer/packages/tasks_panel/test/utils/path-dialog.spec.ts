import { join } from "path";
import { homedir } from "os";
import * as fs from "fs/promises";
import { expect } from "chai";
import { restore, stub } from "sinon";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { showOpenDialog } from "../../src/utils/path-dialog";
import { editTreeItemTask } from "../../src/commands/edit-task";
import { disposeTaskEditorPanel } from "../../src/panels/panels-handler";
import { MockTasksProvider } from "./mockTasksProvider";

describe("showOpenFileDialog function", () => {
  it("returns expected file path", async () => {
    expect(await showOpenDialog("", true, false)).to.eq("File1");
  });

  it("returns expected folder path", async () => {
    expect(await showOpenDialog("", false, true)).to.eq("Folder1");
  });

  it("returns current path when open dialog functionality return undefined", async () => {
    expect(await showOpenDialog("undefined", false, true)).to.eq("undefined");
  });

  describe("handles errors", () => {
    it("when Uri.file function fails, homedir path is used for current path", async () => {
      expect(await showOpenDialog("fail", true, false)).to.eq(join(homedir(), "File1"));
    });

    it("when showOpenDialog method fails, default path returns", async () => {
      expect(await showOpenDialog("failDialog", true, false)).to.eq("failDialog");
    });
  });

  describe("uses workspace folder of the task if input is not provided ", () => {
    const readFile = async function (): Promise<string> {
      return "aaa";
    };

    beforeEach(async () => {
      stub(fs, "readFile").returns(Promise.resolve("buf" as unknown as Buffer));
      const task1: ConfiguredTask = {
        type: "test",
        label: "task 1",
        __intent: "Deploy",
        __wsFolder: "path",
        __index: 0,
      };
      await editTreeItemTask(new MockTasksProvider([task1]), readFile, task1);
    });

    afterEach(() => {
      disposeTaskEditorPanel();
      restore();
    });

    it("returns folder in the workspace path", async () => {
      expect(await showOpenDialog("", false, true)).to.eq(join("path", "Folder1"));
    });

    it("returns file in the workspace path", async () => {
      expect(await showOpenDialog("", true, false)).to.eq(join("path", "File1"));
    });
  });
});
