import type {
  FileSystemWatcher,
  Disposable,
  Uri,
  DiagnosticCollection,
} from "vscode";
import { createSandbox, SinonMock, SinonSandbox, SinonSpy } from "sinon";
import { expect } from "chai";
import * as proxyquire from "proxyquire";
import { VscodeOutputChannel, VscodeWorkspace } from "../../src/vscodeTypes";
import {
  addUnsupportedFilesWatcher,
  internal,
  UnsupportedFilesEvent,
} from "../../src/autofix/unsupportedFilesWatcher";
import { eventUtilProxy, npmDepsValidationProxy } from "../moduleProxies";

describe("packageJsonFileWatcher unit test", () => {
  let sandbox: SinonSandbox;
  let createFileSystemWatcherSpy: SinonSpy;
  let onDidDeleteSpy: SinonSpy;
  let onDidCreateSpy: SinonSpy;

  const fileSystemWatcherMock = <FileSystemWatcher>{};
  fileSystemWatcherMock.onDidDelete = () => <Disposable>{};
  fileSystemWatcherMock.onDidCreate = () => <Disposable>{};

  const workspaceMock = <VscodeWorkspace>{};
  workspaceMock.createFileSystemWatcher = () => fileSystemWatcherMock;

  const vscodeConfigMock: UnsupportedFilesEvent = {
    workspace: workspaceMock,
    diagnosticCollection: <DiagnosticCollection>{},
    outputChannel: <VscodeOutputChannel>{},
    createUri: (path: string) => <Uri>{ fsPath: path },
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
    onDidDeleteSpy = sandbox.spy(fileSystemWatcherMock, "onDidDelete");
    onDidCreateSpy = sandbox.spy(fileSystemWatcherMock, "onDidCreate");
  });

  afterEach(() => {
    createFileSystemWatcherSpy.restore();
    onDidDeleteSpy.restore();
    onDidCreateSpy.restore();
  });

  context("addPackageJsonFileWatcher()", () => {
    it("filesystem watcher created and package.json events are handled", () => {
      addUnsupportedFilesWatcher(vscodeConfigMock);
      expect(
        createFileSystemWatcherSpy.calledOnceWithExactly("**/package.json")
      );
      expect(onDidDeleteSpy.calledOnce);
      expect(onDidCreateSpy.calledOnce);
    });
  });

  context("internal.handleFileEvent()", () => {
    let handleFileEventProxy: typeof internal.handleFileEvent;
    let eventUtilProxySinonMock: SinonMock;
    let npmDepsValidationProxySinonMock: SinonMock;

    beforeEach(() => {
      const packageJsonFileWatcherModule = proxyquire(
        "../../src/autofix/unsupportedFilesWatcher",
        {
          "./eventUtil": eventUtilProxy,
          "@sap-devx/npm-dependencies-validation": npmDepsValidationProxy,
        }
      );

      handleFileEventProxy =
        packageJsonFileWatcherModule.internal.handleFileEvent;

      eventUtilProxySinonMock = sandbox.mock(eventUtilProxy);
      npmDepsValidationProxySinonMock = sandbox.mock(npmDepsValidationProxy);
    });

    afterEach(() => {
      eventUtilProxySinonMock.verify();
      npmDepsValidationProxySinonMock.verify();
    });

    it("handleFileEvent is not called, package.json does not exist in the specified path", async () => {
      const uri = <Uri>{ fsPath: "root/folder/project/yarn.lock" };

      npmDepsValidationProxySinonMock.expects("isPathExist").returns(false);
      eventUtilProxySinonMock.expects("debouncedHandleProjectChange").never();
      await handleFileEventProxy(vscodeConfigMock)(uri);
    });

    it("handleFileEvent is not called, package.json exists in the specified path", async () => {
      const uri = <Uri>{ fsPath: "root/folder/project/yarn.lock" };

      npmDepsValidationProxySinonMock.expects("isPathExist").returns(true);
      eventUtilProxySinonMock
        .expects("debouncedHandleProjectChange")
        .resolves();

      await handleFileEventProxy(vscodeConfigMock)(uri);
    });
  });
});
