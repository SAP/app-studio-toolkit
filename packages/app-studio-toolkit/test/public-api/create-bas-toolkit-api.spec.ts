import { WorkspaceApi } from "@sap/artifact-management";
import { expect } from "chai";
import { BasToolkit } from "@sap-devx/app-studio-toolkit-types";
import { createBasToolkitAPI } from "../../src/public-api/create-bas-toolkit-api";

describe("the `createBasToolkitAPI()` utility", () => {
  let basToolkit: BasToolkit;

  before(() => {
    /* eslint-disable @typescript-eslint/no-unsafe-return -- test dummy mock */
    const dummyReturnArgsWorkspaceImpl = {
      getProjects() {
        return 333;
      },
    } as unknown as WorkspaceApi;

    const dummyBaseBasToolkitApi = {
      getAction() {
        return 666;
      },
    } as unknown as Omit<BasToolkit, "workspaceAPI">;
    /* eslint-enable  @typescript-eslint/no-unsafe-return -- test dummy mock */
    basToolkit = createBasToolkitAPI(
      dummyReturnArgsWorkspaceImpl,
      dummyBaseBasToolkitApi
    );
  });

  describe("the returned API object", () => {
    it("is frozen", () => {
      expect(basToolkit).to.be.frozen;
    });

    it("includes functions from baseBasToolkit", () => {
      expect(basToolkit).to.have.property("getAction");
      expect(basToolkit.getAction("foo")).to.equal(666);
    });

    it("includes workspaceAPI namespace & methods", () => {
      expect(basToolkit).to.have.property("workspaceAPI");
      expect(Object.keys(basToolkit.workspaceAPI)).to.have.members([
        "getProjects",
        "getProjectUris",
        "onWorkspaceChanged",
      ]);
      expect(basToolkit.workspaceAPI.getProjects()).to.equal(333);
    });
  });
});
