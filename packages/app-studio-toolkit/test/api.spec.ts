import { mockVscode } from "./mockUtil";
import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import { SinonSandbox, SinonMock, createSandbox } from "sinon";
import { BasAction, ICommandAction } from "@sap-devx/app-studio-toolkit-types";
import { ActionsController } from "../src/actions/controller";
import * as vscode from "vscode";
import { COMMAND, SNIPPET } from "../src/constants";

use(chaiAsPromised);
const extensions = { getExtension: () => "" };
const testVscode = {
  extensions: extensions,
};

mockVscode(testVscode, "dist/src/api.js");
mockVscode(testVscode, "dist/src/logger/logger.js");

import { baseBasToolkitAPI as bas } from "../src/public-api/base-bas-api";

describe("api unit test", () => {
  let sandbox: SinonSandbox;
  let extensionsMock: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    extensionsMock = sandbox.mock(testVscode.extensions);
  });

  afterEach(() => {
    extensionsMock.verify();
  });

  it("active extension exports are resolved", async () => {
    const extension = {
      isActive: true,
      exports: "api",
    };

    extensionsMock
      .expects("getExtension")
      .withExactArgs("myExt")
      .returns(extension);
    const result = await bas.getExtensionAPI("myExt");
    expect(result).to.be.equal("api");
  });

  it("get actions - without defined actions", () => {
    const result = bas.getAction("myExt");
    expect(result).to.be.undefined;
  });

  it("get actions - with two actions", () => {
    const action1: BasAction = {
      id: "action_1",
      actionType: COMMAND,
      name: "name",
    };
    const action2: BasAction = {
      id: "action_2",
      actionType: SNIPPET,
      context: {},
      contributorId: "contrib1",
      snippetName: "name",
    };
    ActionsController["actions"].push(action1);
    ActionsController["actions"].push(action2);

    const result = bas.getAction("action_1");
    expect(result).to.includes(action1);

    const result2 = bas.getAction("action_2");
    expect(result2).to.includes(action2);
  });

  it("loadActions", () => {
    const action: ICommandAction = {
      id: "abc123",
      actionType: COMMAND,
      name: "name",
    };
    const allExtensioms = [
      {
        packageJSON: {
          BASContributes: {
            actions: [action],
          },
        },
      },
    ];
    _.set(vscode, "extensions.all", allExtensioms);

    ActionsController.loadContributedActions();
    const result = bas.getAction("abc123");
    expect(result).to.be.not.undefined;
    expect(result?.id).to.be.equal(action.id);
    expect(result?.actionType).to.be.equal(action.actionType);
  });

  it("inactive extension is waited for", async () => {
    const extension = {
      isActive: false,
      exports: "api",
    };

    extensionsMock
      .expects("getExtension")
      .withExactArgs("myExt")
      .returns(extension);
    await expect(
      promiseWithTimeout(bas.getExtensionAPI("myExt"), 1000)
    ).to.be.rejectedWith("Timed out");
    extension.isActive = true;
  });

  it("non existing extension is rejected", async () => {
    extensionsMock
      .expects("getExtension")
      .withExactArgs("myExt")
      .returns(undefined);
    await expect(bas.getExtensionAPI("myExt")).to.be.rejectedWith(
      `Extension myExt is not loaded`
    );
  });
});

function promiseWithTimeout(promise: any, timeout: number) {
  return Promise.race([
    promise,
    new Promise(function (resolve, reject) {
      setTimeout(function () {
        reject(new Error("Timed out"));
      }, timeout);
    }),
  ]);
}
