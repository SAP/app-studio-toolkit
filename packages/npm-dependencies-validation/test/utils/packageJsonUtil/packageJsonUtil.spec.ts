import { expect } from "chai";
import { VscodeUri } from "../../../src/types";
import { isCurrentlySupported } from "../../../src/utils/packageJsonUtil";

describe("packageJsonUtil unit test", () => {
  it("not manged by npm, has pnpm-workspace.yaml", async () => {
    const uri: VscodeUri = {
      fsPath:
        "test/utils/packageJsonUtil/projects/pnpm-workspace/wsFolder1/child/package.json",
    };
    const res = await isCurrentlySupported(uri);
    expect(res).to.be.false;
  });

  it("not manged by npm, has .yarnrc.yml", async () => {
    const uri: VscodeUri = {
      fsPath:
        "test/utils/packageJsonUtil/projects/yarnrc-yml/wsFolder1/child/package.json",
    };
    const res = await isCurrentlySupported(uri);
    expect(res).to.be.false;
  });

  it("not manged by npm, has .yarn", async () => {
    const uri: VscodeUri = {
      fsPath:
        "test/utils/packageJsonUtil/projects/yarn/wsFolder1/child/package.json",
    };
    const res = await isCurrentlySupported(uri);
    expect(res).to.be.false;
  });
});
