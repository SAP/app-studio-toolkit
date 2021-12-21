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
import {
  addPackageJsonFileWatcher,
  internal,
} from "../../src/autofix/packageJsonFileWatcher";
import { eventUtilProxy } from "../moduleProxies";

describe("packageJsonFileWatcher unit test", () => {
  let sandbox: SinonSandbox;
  let createFileSystemWatcherSpy: SinonSpy;
  let onDidChangeSpy: SinonSpy;
  let onDidCreateSpy: SinonSpy;

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

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    createFileSystemWatcherSpy = sandbox.spy(
      workspaceMock,
      "createFileSystemWatcher"
    );
    onDidChangeSpy = sandbox.spy(fileSystemWatcherMock, "onDidChange");
    onDidCreateSpy = sandbox.spy(fileSystemWatcherMock, "onDidCreate");
  });

  afterEach(() => {
    createFileSystemWatcherSpy.restore();
    onDidChangeSpy.restore();
    onDidCreateSpy.restore();
  });

  context("addPackageJsonFileWatcher()", () => {
    it("filesystem watcher created and package.json events are handled", () => {
      addPackageJsonFileWatcher(vscodeConfigMock);
      expect(
        createFileSystemWatcherSpy.calledOnceWithExactly("**/package.json")
      );
      expect(onDidChangeSpy.calledOnce);
      expect(onDidCreateSpy.calledOnce);
    });
  });

  context("internal.handleFileEvent()", () => {
    let handleFileEventProxy: typeof internal.handleFileEvent;
    let eventUtilProxySinonMock: SinonMock;

    before(() => {
      const packageJsonFileWatcherModule = proxyquire(
        "../../src/autofix/packageJsonFileWatcher",
        {
          "./eventUtil": eventUtilProxy,
        }
      );

      handleFileEventProxy =
        packageJsonFileWatcherModule.internal.handleFileEvent;

      eventUtilProxySinonMock = sandbox.mock(eventUtilProxy);
    });

    after(() => {
      eventUtilProxySinonMock.verify();
    });

    it("debouncedHandleProjectChange is called", async () => {
      const vscodeConfig = <VscodeFileEventConfig>{};
      const uri = <Uri>{};
      eventUtilProxySinonMock
        .expects("debouncedHandleProjectChange")
        .withExactArgs(uri, vscodeConfig)
        .resolves();
      await handleFileEventProxy(vscodeConfig)(uri);
    });
  });
});
