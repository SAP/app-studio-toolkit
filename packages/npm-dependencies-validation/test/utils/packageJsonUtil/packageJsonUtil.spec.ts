import { expect } from "chai";
import { VscodeFsUri, VscodeWsFolder } from "../../../src/types";
import { isValidPackageJson } from "../../../src/utils/packageJsonUtil";

describe.only("packageJsonUtil unit test", () => {
  it("invalid parent with yarn.lock", async () => {
    const wsFolders: VscodeWsFolder[] = [
      {
        uri: {
          fsPath: "test/utils/packageJsonUtil/projects/yarn-lock/wsFolder2",
        },
      },
      {
        uri: {
          fsPath: "test/utils/packageJsonUtil/projects/yarn-lock/wsFolder1",
        },
      },
    ];
    const uri: VscodeFsUri = {
      fsPath:
        "test/utils/packageJsonUtil/projects/yarn-lock/wsFolder1/child/package.json",
    };
    const res = await isValidPackageJson(wsFolders, uri);
    expect(res).to.be.false;
  });

  it("invalid parent with .yarnrc.yml", async () => {
    const wsFolders: VscodeWsFolder[] = [
      {
        uri: {
          fsPath: "test/utils/packageJsonUtil/projects/yarnrc-yml/wsFolder2",
        },
      },
      {
        uri: {
          fsPath: "test/utils/packageJsonUtil/projects/yarnrc-yml/wsFolder1",
        },
      },
    ];
    const uri: VscodeFsUri = {
      fsPath:
        "test/utils/packageJsonUtil/projects/yarnrc-yml/wsFolder1/child/package.json",
    };
    const res = await isValidPackageJson(wsFolders, uri);
    expect(res).to.be.false;
  });

  it("invalid parent with .yarn", async () => {
    const wsFolders: VscodeWsFolder[] = [
      {
        uri: { fsPath: "test/utils/packageJsonUtil/projects/yarn/wsFolder2" },
      },
      {
        uri: { fsPath: "test/utils/packageJsonUtil/projects/yarn/wsFolder1" },
      },
    ];
    const uri: VscodeFsUri = {
      fsPath:
        "test/utils/packageJsonUtil/projects/yarn/wsFolder1/child/package.json",
    };
    const res = await isValidPackageJson(wsFolders, uri);
    expect(res).to.be.false;
  });
});
