import { expect } from "chai";
import { VscodeFsUri, VscodeWsFolder } from "../../../src/types";
import { isManagedByNpm6 } from "../../../src/utils/packageJsonUtil";

describe("packageJsonUtil unit test", () => {
  it("not manged by npm, has pnpm-workspace.yaml", async () => {
    const uri: VscodeFsUri = {
      fsPath:
        "test/utils/packageJsonUtil/projects/pnpm-workspace/wsFolder1/child/package.json",
    };
    const res = await isManagedByNpm6(uri);
    expect(res).to.be.false;
  });

  it("not manged by npm, has .yarnrc.yml", async () => {
    const uri: VscodeFsUri = {
      fsPath:
        "test/utils/packageJsonUtil/projects/yarnrc-yml/wsFolder1/child/package.json",
    };
    const res = await isManagedByNpm6(uri);
    expect(res).to.be.false;
  });

  it("not manged by npm, has .yarn", async () => {
    const uri: VscodeFsUri = {
      fsPath:
        "test/utils/packageJsonUtil/projects/yarn/wsFolder1/child/package.json",
    };
    const res = await isManagedByNpm6(uri);
    expect(res).to.be.false;
  });
});
