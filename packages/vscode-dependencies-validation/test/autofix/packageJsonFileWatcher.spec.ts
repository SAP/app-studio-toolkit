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

  context("internal.onCreate()", () => {
    let onCreateProxy: typeof internal.onCreate;
    let eventUtilProxySinonMock: SinonMock;

    before(() => {
      const packageJsonFileWatcherModule = proxyquire(
        "../../src/autofix/packageJsonFileWatcher",
        {
          "./eventUtil": eventUtilProxy,
        }
      );

      onCreateProxy = packageJsonFileWatcherModule.internal.onCreate;

      eventUtilProxySinonMock = sandbox.mock(eventUtilProxy);
    });

    after(() => {
      eventUtilProxySinonMock.verify();
    });

    it("handlePackageJsonEvent is called", async () => {
      const vscodeConfig = <VscodeFileEventConfig>{};
      const uri = <Uri>{};
      eventUtilProxySinonMock
        .expects("handlePackageJsonEvent")
        .withExactArgs(uri, vscodeConfig)
        .resolves();
      await onCreateProxy(vscodeConfig)(uri);
    });
  });

  context("internal.onChange()", () => {
    let onChangeProxy: typeof internal.onChange;
    let eventUtilProxySinonMock: SinonMock;

    before(() => {
      const packageJsonFileWatcherModule = proxyquire(
        "../../src/autofix/packageJsonFileWatcher",
        {
          "./eventUtil": eventUtilProxy,
        }
      );

      onChangeProxy = packageJsonFileWatcherModule.internal.onChange;

      eventUtilProxySinonMock = sandbox.mock(eventUtilProxy);
    });

    after(() => {
      eventUtilProxySinonMock.verify();
    });

    it.skip("debouncedHandlePackageJsonEvent is called", async () => {
      const vscodeConfig = <VscodeFileEventConfig>{};
      const uri = <Uri>{};
      eventUtilProxySinonMock
        .expects("handlePackageJsonEvent")
        .withExactArgs(uri, vscodeConfig)
        .resolves();
      await onChangeProxy(vscodeConfig)(uri);
    });
  });
});
