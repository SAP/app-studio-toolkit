import { WorkspaceApi, Tag } from "@sap/artifact-management";
import { WorkspaceFolder } from "vscode";
import { expect } from "chai";
import { createWorkspaceProxy } from "../../src/public-api/create-workspace-proxy";
import { BasWorkspaceApi } from "@sap-devx/app-studio-toolkit-types";

describe("the `createWorkspaceProxy` utility", () => {
  let workspaceProxy: BasWorkspaceApi;

  before(() => {
    /* eslint-disable @typescript-eslint/no-unsafe-return -- test dummy mock */
    const dummyReturnArgsWorkspaceImpl = {
      getProjects(...args: any[]) {
        return args;
      },
      getProjectUris(...args: any[]) {
        return args;
      },
      onWorkspaceChanged(...args: any[]) {
        return args;
      },
    } as unknown as WorkspaceApi;
    /* eslint-enable  @typescript-eslint/no-unsafe-return -- test dummy mock */
    workspaceProxy = createWorkspaceProxy(dummyReturnArgsWorkspaceImpl);
  });

  context("WorkspaceProxy Object", () => {
    it("is frozen", () => {
      expect(workspaceProxy).to.be.frozen;
    });

    it("is sealed", () => {
      expect(workspaceProxy).to.be.sealed;
    });

    it("exposes only three properties", () => {
      expect(Object.keys(workspaceProxy)).to.have.lengthOf(3);
    });
  });

  context("`getProjects()` method", () => {
    it("is exposed", () => {
      expect(workspaceProxy).to.have.property("getProjects");
      expect(typeof workspaceProxy.getProjects).to.equal("function");
    });

    it("passes through arguments", () => {
      expect(workspaceProxy.getProjects(Tag.CAP)).to.deep.equal([Tag.CAP]);
    });
  });

  context("`getProjectUris()` method", () => {
    it("is exposed", () => {
      expect(workspaceProxy).to.have.property("getProjectUris");
      expect(typeof workspaceProxy.getProjectUris).to.equal("function");
    });

    it("passes through arguments", () => {
      // @ts-expect-error -- `getProjectUris` has no arguments, but we cannot assume it will
      //                      never have any arguments so the pass-through is still implemented and tested.
      expect(workspaceProxy.getProjectUris("dummyArg")).to.deep.equal([
        "dummyArg",
      ]);
    });
  });

  context("`onWorkspaceChanged()` method", () => {
    it("is exposed", () => {
      expect(workspaceProxy).to.have.property("onWorkspaceChanged");
      expect(typeof workspaceProxy.onWorkspaceChanged).to.equal("function");
    });

    it("passes through arguments", () => {
      const changeHandler = (event: string, folders: WorkspaceFolder[]) => {};
      expect(workspaceProxy.onWorkspaceChanged(changeHandler)).to.deep.equal([
        changeHandler,
      ]);
    });
  });
});
