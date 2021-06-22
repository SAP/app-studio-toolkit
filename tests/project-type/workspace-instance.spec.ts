import { WorkspaceImpl } from "@sap/project-api";
import { expect } from "chai";
import { uniq } from "lodash";

import { mockVscode } from "../mockUtil";

const testVscode = {
    workspace: {
        workspaceFolders: () => []
    }
};

mockVscode(testVscode, "src/project-type/workspace-instance.ts");
import { getBasWorkspaceAPI } from "../../src/project-type/workspace-instance";

describe.skip("getBasWorkspaceAPI", () => {
    it("multiple bas workspace instances should be equal", () => {
        const basWsInstances = [];
        for (let i = 0; i < 5; i++) {
            basWsInstances.push(getBasWorkspaceAPI(WorkspaceImpl));
        }
        expect(uniq(basWsInstances)).to.have.lengthOf(1);
    });
});
