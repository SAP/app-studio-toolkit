import { expect } from "chai";
import { createSandbox, SinonMock, SinonSandbox } from "sinon";
import * as nsVsMock from "./ext/mockVscode";
import { mockVscode } from "./ext/mockUtil";
mockVscode(nsVsMock.testVscode, "src/commands.ts");
import * as commands from "../src/commands";
import * as cfLocal from "@sap/cf-tools/out/src/cf-local";
import { Cli, CliResult, ITarget } from "@sap/cf-tools";
import { messages } from "../src/messages";
import * as cfView from "../src/cfView";
import { toText } from "../src/utils";
import * as proxyquire from "proxyquire";

describe("commands unit tests", () => {
  let sandbox: SinonSandbox;
  let vscodeWindowMock: SinonMock;
  let cliMock: SinonMock;
  let cfLocalMock: SinonMock;
  let cfViewMock: SinonMock;
  let openLoginViewMock: SinonMock;
  let internal: any;

  const orgs: any[] = [
    { label: "devx", guid: "1" },
    { label: "devx2", guid: "2" },
    { label: "HRTT", guid: "3" },
    { label: "SAP_CoCo_Messaging", guid: "4" },
  ];
  const spaces: any[] = [{ label: "ArchTeam" }, { label: "platform2" }];
  const openLoginViewProxy = {
    openLoginView: () => Promise.reject(new Error("not implemented")),
  };

  before(() => {
    internal = proxyquire("../src/commands", {
      vscode: {
        "@noCallThru": true,
      },
      "@noCallThru": true,
      "./loginTargetView/loginTargetView": openLoginViewProxy,
    }).internal;
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    vscodeWindowMock = sandbox.mock(nsVsMock.testVscode.window);
    cfViewMock = sandbox.mock(cfView.CFView);
    cfLocalMock = sandbox.mock(cfLocal);
    openLoginViewMock = sandbox.mock(openLoginViewProxy);
    cliMock = sandbox.mock(Cli);
  });

  afterEach(() => {
    cfLocalMock.verify();
    vscodeWindowMock.verify();
    cliMock.verify();
    cfViewMock.verify();
    openLoginViewMock.verify();
    sandbox.restore();
  });

  describe("verifyLoginRetry", () => {
    it("fail:: canceled", async () => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .rejects(undefined);
      expect(await commands.verifyLoginRetry()).to.be.undefined;
    });
  });

  describe("onErrorCfLogin", () => {
    it("should handle login error by calling cmdLogin and retrying empty string", async () => {
      const errorMessage = "login";
      openLoginViewMock
        .expects("openLoginView")
        .withExactArgs({ isSplit: true, isLoginOnly: true }, "https://example.com", "", "")
        .resolves(undefined);
      let expErr: any = null;
      const error = new Error(errorMessage);

      await internal
        .onErrorCfLogin(error, "https://example.com")
        .catch((errorMessage: Error) => (expErr = errorMessage));
      expect(expErr).to.be.equal("");
    });

    it("should handle undefined error gracefully", async () => {
      const err = new Error("test");
      let expErr: any = null;
      await internal.onErrorCfLogin(err).catch((errorMessage: Error) => (expErr = errorMessage));

      // Assert that console.error was not called
      expect(expErr.message).to.exist;
      expect(expErr.message).to.be.equal(err.message);
    });
  });

  describe("cmdSelectAndSaveTarget", () => {
    const target: ITarget = {
      "api endpoint": "endPoint",
      org: "test-org",
      space: "test-space",
      user: "user",
      "api version": "3.100.0",
    };
    const cliResult: CliResult = { stdout: "some text", stderr: "", exitCode: 0 };

    it("ok:: show selection dialog - canceled", async () => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves({});
      cfLocalMock.expects("cfGetTarget").resolves(target);
      const org = target.org || "";
      const space = target.space || "";
      const affairs = [
        {
          id: "save",
          label: messages.set_targets_save(org, space),
          detail: messages.set_targets_save_details,
        },
        { id: "pick-save", label: messages.set_targets_pick_save, detail: messages.set_targets_pick_save_details },
      ];
      vscodeWindowMock
        .expects("showQuickPick")
        .withExactArgs(affairs, {
          placeHolder: messages.set_targets_choose_the_operation,
          canPickMany: false,
          matchOnDetail: true,
        })
        .resolves();
      expect(await commands.cmdSelectAndSaveTarget()).to.be.undefined;
    });

    it("fail:: login wrong", async () => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves();
      expect(await commands.cmdSelectAndSaveTarget()).to.be.undefined;
    });

    it("fail:: unsupported operation selected", async () => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves({});
      cfLocalMock.expects("cfGetTarget").resolves(target);
      vscodeWindowMock.expects("showQuickPick").resolves({ id: "wrong" });
      expect(await commands.cmdSelectAndSaveTarget()).to.be.undefined;
    });

    it("ok:: save current target operation selected", async () => {
      const label = "test-Target";
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves({});
      vscodeWindowMock.expects("showQuickPick").resolves({ id: "save" });
      cfLocalMock.expects("cfGetTarget").resolves(target);
      //...cmdCreateTarget
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.name_for_target, ignoreFocusOut: true })
        .resolves(label);
      const saveTargetParams = ["save-target", "-f", label];
      cliMock.expects("execute").withExactArgs(saveTargetParams).resolves(cliResult);
      cfViewMock.expects("get").returns({
        refresh: () => {
          return;
        },
      });
      vscodeWindowMock.expects("showInformationMessage").withExactArgs(messages.target_created(label));
      //
      expect(await commands.cmdSelectAndSaveTarget()).to.be.equals(label);
    });

    it("ok:: save current target operation selected, create target command canceled", async () => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves({});
      vscodeWindowMock.expects("showQuickPick").resolves({ id: "save" });
      cfLocalMock.expects("cfGetTarget").resolves(target);
      //...cmdCreateTarget canceled
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.name_for_target, ignoreFocusOut: true })
        .resolves();
      //
      expect(await commands.cmdSelectAndSaveTarget()).to.be.undefined;
    });

    it("ok:: save current target operation selected, target setup is incompleted, canceled", async () => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves({});
      vscodeWindowMock.expects("showQuickPick").resolves({ id: "save" });
      const t: ITarget = { "api endpoint": "endPoint", user: "user", "api version": "3.100.0" };
      cfLocalMock.expects("cfGetTarget").resolves(t);
      vscodeWindowMock
        .expects("showWarningMessage")
        .withExactArgs(messages.target_setup_not_completed(t.org, t.space), "OK", "Cancel")
        .resolves("Cancel");
      expect(await commands.cmdSelectAndSaveTarget()).to.be.undefined;
    });

    it("ok:: save current target operation selected, target setup is incompleted (partial), canceled", async () => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves({});
      vscodeWindowMock.expects("showQuickPick").resolves({ id: "save" });
      const t: ITarget = { "api endpoint": "endPoint", user: "user", "api version": "3.100.0", org: "test-org" };
      cfLocalMock.expects("cfGetTarget").resolves(t);
      vscodeWindowMock
        .expects("showWarningMessage")
        .withExactArgs(messages.target_setup_not_completed(t.org, t.space), "OK", "Cancel")
        .resolves("Cancel");
      expect(await commands.cmdSelectAndSaveTarget()).to.be.undefined;
    });

    it("ok:: save current target operation selected, target setup is incompleted (partial), continued", async () => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves({});
      vscodeWindowMock.expects("showQuickPick").resolves({ id: "save" });
      const t: ITarget = { "api endpoint": "endPoint", user: "user", "api version": "3.100.0", space: "test-space" };
      cfLocalMock.expects("cfGetTarget").resolves(t);
      vscodeWindowMock
        .expects("showWarningMessage")
        .withExactArgs(messages.target_setup_not_completed(t.org, t.space), "OK", "Cancel")
        .resolves("OK");
      //...cmdCreateTarget canceled
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.name_for_target, ignoreFocusOut: true })
        .resolves();
      //
      expect(await commands.cmdSelectAndSaveTarget()).to.be.undefined;
    });

    it("ok:: save current target operation selected, create target command throws exception", async () => {
      const label = "test-Target";
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves({});
      vscodeWindowMock.expects("showQuickPick").resolves({ id: "save" });
      cfLocalMock.expects("cfGetTarget").resolves(target);
      //...cmdCreateTarget
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.name_for_target, ignoreFocusOut: true })
        .resolves(label);
      const saveTargetParams = ["save-target", "-f", label];
      const cli: CliResult = { exitCode: 1, stdout: "create target command error", stderr: "" };
      cliMock.expects("execute").withExactArgs(saveTargetParams).resolves(cli);
      //
      vscodeWindowMock
        .expects("showErrorMessage")
        .withExactArgs(toText(new Error(cli.stdout)))
        .resolves();
      expect(await commands.cmdSelectAndSaveTarget()).to.be.undefined;
    });

    it.skip("ok:: new target operation selected, other endPoint typed", async () => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves({});
      vscodeWindowMock.expects("showQuickPick").resolves({ id: "pick-save" });
      cfLocalMock.expects("cfGetTarget").resolves(target);
      const selectedEndPoint = "other-end-point";
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_cf_endpoint, value: target["api endpoint"], ignoreFocusOut: true })
        .resolves(selectedEndPoint);
      cliMock.expects("execute").withExactArgs(["api", selectedEndPoint], undefined, undefined).resolves(cliResult);
      // ...cmdCFSetOrgSpace
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves({ data: {} });
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({ location: nsVsMock.testVscode.ProgressLocation.Window, title: messages.getting_orgs })
        .resolves(orgs);
      vscodeWindowMock
        .expects("showQuickPick")
        .withExactArgs(orgs, {
          placeHolder: messages.select_org,
          canPickMany: false,
          matchOnDetail: true,
          ignoreFocusOut: true,
        })
        .resolves(orgs[1]);
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({ location: nsVsMock.testVscode.ProgressLocation.Window, title: messages.getting_spaces })
        .resolves(spaces);
      vscodeWindowMock
        .expects("showQuickPick")
        .withExactArgs(spaces, {
          placeHolder: messages.select_space,
          canPickMany: false,
          matchOnDetail: true,
          ignoreFocusOut: true,
        })
        .resolves(spaces[0]);
      vscodeWindowMock.expects("showInformationMessage").withExactArgs(messages.success_set_org_space).resolves();
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({ location: nsVsMock.testVscode.ProgressLocation.Window, title: messages.set_org_space })
        .resolves();
      //...cmdCreateTarget canceled
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.name_for_target, ignoreFocusOut: true })
        .resolves();
      //
      expect(await commands.cmdSelectAndSaveTarget()).to.be.undefined;
    });

    it.skip("ok:: new target operation selected, other endPoint typed, cmdCFSetOrgSpace fails", async () => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves({});
      vscodeWindowMock.expects("showQuickPick").resolves({ id: "pick-save" });
      cfLocalMock.expects("cfGetTarget").resolves(target);
      const selectedEndPoint = "other-end-point";
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_cf_endpoint, value: target["api endpoint"], ignoreFocusOut: true })
        .resolves(selectedEndPoint);
      cliMock.expects("execute").withExactArgs(["api", selectedEndPoint], undefined, undefined).resolves(cliResult);
      // ...cmdCFSetOrgSpace fails
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves({ data: {} });
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({ location: nsVsMock.testVscode.ProgressLocation.Window, title: messages.getting_orgs })
        .resolves(orgs);
      vscodeWindowMock
        .expects("showQuickPick")
        .withExactArgs(orgs, {
          placeHolder: messages.select_org,
          canPickMany: false,
          matchOnDetail: true,
          ignoreFocusOut: true,
        })
        .resolves();
      //
      expect(await commands.cmdSelectAndSaveTarget()).to.be.undefined;
    });

    it.skip("ok:: new target operation selected, endPoint selection canceled", async () => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves({});
      vscodeWindowMock.expects("showQuickPick").resolves({ id: "pick-save" });
      cfLocalMock.expects("cfGetTarget").resolves(target);
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_cf_endpoint, value: target["api endpoint"], ignoreFocusOut: true })
        .resolves();
      expect(await commands.cmdSelectAndSaveTarget()).to.be.undefined;
    });

    it.skip("ok:: new target operation selected, same endPoint typed", async () => {
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves({});
      vscodeWindowMock.expects("showQuickPick").resolves({ id: "pick-save" });
      cfLocalMock.expects("cfGetTarget").resolves(target);
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.enter_cf_endpoint, value: target["api endpoint"], ignoreFocusOut: true })
        .resolves(target["api endpoint"]);
      // ...cmdCFSetOrgSpace
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({
          location: nsVsMock.testVscode.ProgressLocation.Notification,
          title: messages.verify_cf_connectivity,
          cancellable: false,
        })
        .resolves({ data: {} });
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({ location: nsVsMock.testVscode.ProgressLocation.Window, title: messages.getting_orgs })
        .resolves(orgs);
      vscodeWindowMock
        .expects("showQuickPick")
        .withExactArgs(orgs, {
          placeHolder: messages.select_org,
          canPickMany: false,
          matchOnDetail: true,
          ignoreFocusOut: true,
        })
        .resolves(orgs[1]);
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({ location: nsVsMock.testVscode.ProgressLocation.Window, title: messages.getting_spaces })
        .resolves(spaces);
      vscodeWindowMock
        .expects("showQuickPick")
        .withExactArgs(spaces, {
          placeHolder: messages.select_space,
          canPickMany: false,
          matchOnDetail: true,
          ignoreFocusOut: true,
        })
        .resolves(spaces[0]);
      vscodeWindowMock.expects("showInformationMessage").withExactArgs(messages.success_set_org_space).resolves();
      vscodeWindowMock
        .expects("withProgress")
        .withArgs({ location: nsVsMock.testVscode.ProgressLocation.Window, title: messages.set_org_space })
        .resolves();
      //...cmdCreateTarget canceled
      vscodeWindowMock
        .expects("showInputBox")
        .withExactArgs({ prompt: messages.name_for_target, ignoreFocusOut: true })
        .resolves();
      //
      expect(await commands.cmdSelectAndSaveTarget()).to.be.undefined;
    });
  });
});
