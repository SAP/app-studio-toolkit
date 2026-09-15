import { expect } from "chai";
import { mockVscode, testVscode } from "./utils/mockVSCode";

mockVscode("src/task-provider");
import { NpmTaskProvider } from "../src/task-provider";
import { Task, TaskScope } from "vscode";
import { cloneDeep, set } from "lodash";
import { stub } from "sinon";
import * as _path from "path";

describe("TaskProvider unit test scope", () => {
  const provider = new NpmTaskProvider();
  const task = {
    name: "label",
    type: "type",
    definition: { script: "script", path: "path" },
    scope: { uri: { path: _path.join("/", "my", "project") } },
  };

  it("provideTasks", async () => {
    expect(await provider.provideTasks()).to.be.deep.equal([]);
  });

  it("resolveTask, cwd resolved", async () => {
    const resolved = provider.resolveTask(task as unknown as Task);
    expect(resolved).to.be.exist;
    expect((<Task>resolved).definition).to.be.deep.equal(task.definition);
  });

  it("resolveTask, cwd resolved", async () => {
    const other = cloneDeep(task) as unknown as Task;
    delete (<any>other).scope;
    expect(provider.resolveTask(other)).to.be.exist;
  });

  it("resolveCwd, task.scope undefined", async () => {
    const other = cloneDeep(task) as unknown as Task;
    set(other, "scope", TaskScope.Workspace);
    expect(provider["resolveCwd"](other)).to.be.undefined;
  });

  it("resolveCwd, task.scope undefined, but workspace set", async () => {
    const fsFolder = _path.join("/", "project", "my");
    stub(testVscode.workspace, "workspaceFolders").value([{ uri: { path: fsFolder } }]);
    const other = cloneDeep(task) as unknown as Task;
    set(other, "scope", TaskScope.Workspace);
    expect(provider["resolveCwd"](other)).to.be.equal(_path.resolve(fsFolder));
  });
});
