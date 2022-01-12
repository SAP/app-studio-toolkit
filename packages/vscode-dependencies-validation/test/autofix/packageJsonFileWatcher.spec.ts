import type {
  FileSystemWatcher,
  Disposable,
  DiagnosticCollection,
  Uri,
} from "vscode";
import { createSandbox, SinonMock, SinonSandbox, SinonSpy } from "sinon";
import { expect } from "chai";
import * as proxyquire from "proxyquire";
import {
  VscodeFileEventConfig,
  VscodeOutputChannel,
  VscodeWorkspace,
} from "../../src/vscodeTypes";
import type {
  addPackageJsonFileWatcher,
  internal,
} from "../../src/autofix/packageJsonFileWatcher";
import { eventUtilProxy } from "../moduleProxies";

describe("packageJsonFileWatcher unit test", () => {
  let sandbox: SinonSandbox;
  let createFileSystemWatcherSpy: SinonSpy;
  let onDidChangeSpy: SinonSpy;
  let onDidCreateSpy: SinonSpy;
  let handleFileEventProxy: typeof internal.handleFileEvent;
  let addPckJsonFileWatcher: typeof addPackageJsonFileWatcher;
  let eventUtilProxySinonMock: SinonMock;

  const fileSystemWatcherMock = <FileSystemWatcher>{};
  fileSystemWatcherMock.onDidChange = () => <Disposable>{};
  fileSystemWatcherMock.onDidCreate = () => <Disposable>{};

  const workspaceMock = <VscodeWorkspace>{};
  workspaceMock.createFileSystemWatcher = () => fileSystemWatcherMock;

  const vscodeConfigMock: VscodeFileEventConfig = {
    workspace: workspaceMock,
    diagnosticCollection: <DiagnosticCollection>{},
    outputChannel: <VscodeOutputChannel>{},
  };

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    sandbox = createSandbox();

    createFileSystemWatcherSpy = sandbox.spy(
      workspaceMock,
      "createFileSystemWatcher"
    );
    onDidChangeSpy = sandbox.spy(fileSystemWatcherMock, "onDidChange");
    onDidCreateSpy = sandbox.spy(fileSystemWatcherMock, "onDidCreate");

    const packageJsonFileWatcherModule = proxyquire(
      "../../src/autofix/packageJsonFileWatcher",
      {
        "./eventUtil": eventUtilProxy,
      }
    );

    handleFileEventProxy =
      packageJsonFileWatcherModule.internal.handleFileEvent;

    addPckJsonFileWatcher =
      packageJsonFileWatcherModule.addPackageJsonFileWatcher;

    eventUtilProxySinonMock = sandbox.mock(eventUtilProxy);
  });

  afterEach(() => {
    createFileSystemWatcherSpy.restore();
    onDidChangeSpy.restore();
    onDidCreateSpy.restore();
    eventUtilProxySinonMock.verify();
  });

  context("addPackageJsonFileWatcher()", () => {
    it("filesystem watcher created and package.json events are handled", () => {
      addPckJsonFileWatcher(vscodeConfigMock);
      expect(
        createFileSystemWatcherSpy.calledOnceWithExactly("**/package.json")
      );
      expect(onDidChangeSpy.calledOnce);
      expect(onDidCreateSpy.calledOnce);
    });
  });

  context("internal.handleFileEvent()", () => {
    it("debouncedHandlePkgJsonAutoFix is called", async () => {
      const vscodeConfig = <VscodeFileEventConfig>{};
      const uri = <Uri>{};
      eventUtilProxySinonMock
        .expects("debouncedHandlePkgJsonAutoFix")
        .withExactArgs(uri, vscodeConfig)
        .resolves();
      await handleFileEventProxy(vscodeConfig)(uri);
    });
  });
});
