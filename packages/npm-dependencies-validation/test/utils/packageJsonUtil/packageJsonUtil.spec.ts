import { expect } from "chai";
import { isCurrentlySupported } from "../../../src/utils/packageJsonUtil";

describe("packageJsonUtil unit test", () => {
  it("not manged by npm, has pnpm-workspace.yaml", async () => {
    const packageJsonPath =
      "test/utils/packageJsonUtil/projects/pnpm-workspace/wsFolder1/child/package.json";
    const res = await isCurrentlySupported(packageJsonPath);
    expect(res).to.be.false;
  });

  it("not manged by npm, has .yarnrc.yml", async () => {
    const packageJsonPath =
      "test/utils/packageJsonUtil/projects/yarnrc-yml/wsFolder1/child/package.json";
    const res = await isCurrentlySupported(packageJsonPath);
    expect(res).to.be.false;
  });

  it("not manged by npm, has .yarn", async () => {
    const packageJsonPath =
      "test/utils/packageJsonUtil/projects/yarn/wsFolder1/child/package.json";
    const res = await isCurrentlySupported(packageJsonPath);
    expect(res).to.be.false;
  });

  it("not manged by npm, mono repo", async () => {
    const packageJsonPath =
      "test/utils/packageJsonUtil/projects/monoRepo/package.json";
    const res = await isCurrentlySupported(packageJsonPath);
    expect(res).to.be.false;
  });
});
