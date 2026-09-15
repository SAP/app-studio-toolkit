import { expect } from "chai";
import { mockVscode, resetTestVSCode, testVscode } from "../utils/mockVSCode";
import { EmptyTaskTreeItem, IntentTreeItem, ProjectTreeItem, TaskTreeItem } from "../../src/view/task-tree-item";
import { ThemeIcon, TreeItemCollapsibleState } from "vscode";
import { stub } from "sinon";
import * as path from "path";

mockVscode("src/view/tasks-tree-item");

describe("IntentTreeItem class", () => {
  afterEach(() => {
    resetTestVSCode();
  });

  it("IntentTreeItem instance verifying", () => {
    const label = "my-label";
    const item = new IntentTreeItem(label);
    expect(item.collapsibleState).to.equal(TreeItemCollapsibleState.Expanded);
    expect(item.label).to.equal(label);
    expect(item.contextValue).to.equal("intent");
    expect(item.tooltip).to.equal("");
  });

  it("IntentTreeItem - misc", () => {
    const label = "my-label";
    const item = new IntentTreeItem(label, TreeItemCollapsibleState.Collapsed);
    expect(item.collapsibleState).to.equal(TreeItemCollapsibleState.Collapsed);
    expect(item.label).to.equal(label);
    expect(item.contextValue).to.equal("intent");
    expect(item.tooltip).to.equal("");
  });
});

describe("TaskTreeItem class", () => {
  afterEach(() => {
    resetTestVSCode();
  });
  const label = "my-label";
  const index = 3;
  const type = "myType";
  const wsFolder = path.join(path.sep, "my", "path");
  const state = TreeItemCollapsibleState.Expanded;
  const parentItem = new IntentTreeItem("dummy", testVscode.TreeItemCollapsibleState.None);

  it("TaskTreeItem instance structure", () => {
    const item = new TaskTreeItem(index, type, label, wsFolder, state, parentItem);
    expect(item.collapsibleState).to.be.equal(state);
    expect(item.label).to.be.equal(label);
    expect(item.type).to.be.equal(type);
    expect(item.index).to.be.equal(index);
    expect(item.wsFolder).to.be.equal(wsFolder);
    expect(item.contextValue).to.be.undefined;
    expect(item.tooltip).to.be.equal("");
  });

  it("TaskTreeItem instance, with command", () => {
    const command = { title: "title", command: "command", arguments: [{ name: "name", __intent: "other" }] };
    const item = new TaskTreeItem(index, type, label, wsFolder, state, parentItem, command);
    expect(item.command).to.deep.equal(command);
    expect(item.contextValue).to.equal("task--idle");
    expect(item.iconPath).to.deep.equal(new ThemeIcon("inspect"));
  });

  it("TaskTreeItem instance, with command task.intent = 'deploy'", () => {
    const command = { title: "title", command: "command", arguments: [{ name: "name", __intent: "deploy" }] };
    const item = new TaskTreeItem(index, type, label, wsFolder, state, parentItem, command);
    expect(item.iconPath).to.deep.equal(new ThemeIcon("rocket"));
  });

  it("TaskTreeItem instance, with command task.intent = 'Build'", () => {
    const command = { title: "title", command: "command", arguments: [{ name: "name", __intent: "build" }] };
    const item = new TaskTreeItem(index, type, label, wsFolder, state, parentItem, command);
    expect(item.iconPath).to.deep.equal(new ThemeIcon("package"));
  });

  it("TaskTreeItem instance, with command, running", () => {
    stub(testVscode.tasks, "taskExecutions").value([{ task: { name: label, definition: { type } } }]);
    const command = { title: "title", command: "command", arguments: [{ label, type }] };
    const item = new TaskTreeItem(index, type, label, wsFolder, state, parentItem, command);
    expect(item.contextValue).to.equal("task--running");
  });

  it("EmptyTreeItem instance - inpect", () => {
    const parentItem = new ProjectTreeItem(
      "dummy",
      path.join(path.sep, "home", "dummy", "project"),
      undefined,
      TreeItemCollapsibleState.Expanded,
    );
    const item = new EmptyTaskTreeItem(parentItem);
    expect(item.contextValue).to.be.undefined;
    expect(item.label).to.equal("Create a task");
    expect(item.collapsibleState).to.equal(TreeItemCollapsibleState.None);
    expect(item.iconPath).to.deep.equal(new ThemeIcon("add"));
    expect(item.command).to.deep.equal({
      command: "tasks-explorer.createTask",
      title: "Create Task",
      arguments: [parentItem],
    });
  });

  it("EmptyTreeItem instance - inpect", () => {
    const parentItem = new ProjectTreeItem("dummy", path.join(path.sep, "home", "dummy", "project"));
    const item = new EmptyTaskTreeItem(parentItem);
    expect(item.contextValue).to.be.undefined;
    expect(item.label).to.be.equal("Create a task");
    expect(item.collapsibleState).to.be.equal(TreeItemCollapsibleState.None);
    expect(item.iconPath).to.be.deep.equal(new ThemeIcon("add"));
    expect(item.command).to.be.deep.equal({
      command: "tasks-explorer.createTask",
      title: "Create Task",
      arguments: [parentItem],
    });
  });
});
