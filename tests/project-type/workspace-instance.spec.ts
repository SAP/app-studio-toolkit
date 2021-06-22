import { expect } from "chai";
import * as _ from "lodash";
import { mockVscode } from "../mockUtil";

const testVscode = {
    workspace: {
        workspaceFolders: () => [],
        onDidChangeWorkspaceFolders: () => ""
    }
};

mockVscode(testVscode, "src/project-type/workspace-instance.ts");
import { getBasWorkspaceAPI } from "../../src/project-type/workspace-instance";

describe("getBasWorkspaceAPI", () => {
    it("multiple bas workspace instances should be identical", () => {
        const basWsInstances = _.map(_.range(0,5), getBasWorkspaceAPI);
        expect(_.uniq(basWsInstances)).to.have.lengthOf(1);
    });
});
