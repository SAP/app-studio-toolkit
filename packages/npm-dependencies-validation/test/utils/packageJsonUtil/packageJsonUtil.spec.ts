import { expect } from "chai";
import {
  isCurrentlySupported,
  internal,
} from "../../../src/utils/packageJsonUtil";

describe("packageJsonUtil unit test", () => {
  context("isCurrentlySupported()", () => {
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

    it("manged by npm", async () => {
      const packageJsonPath =
        "test/utils/packageJsonUtil/projects/npm-managed/package.json";
      const res = await isCurrentlySupported(packageJsonPath);
      expect(res).to.be.true;
    });
  });

  context("readJsonFile()", () => {
    it("non existing package.json", async () => {
      const packageJsonPath =
        "test/utils/packageJsonUtil/projects/not-existing-folder/package.json";
      const res = await internal.readJsonFile(packageJsonPath);
      expect(res).to.be.empty;
    });
  });
});
