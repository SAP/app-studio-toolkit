import { resolve, join, dirname } from "path";
import { expect } from "chai";
import { removeSync } from "fs-extra";
import { last, noop } from "lodash";
import { OutputChannel } from "../src/types";
import { fixDependencyIssues, findDependencyIssues } from "../src/api";
import { npmSpawnTestTimeout } from "./config";

describe("`fixDependencyIssues()` function ", () => {
  context("negative", () => {
    it("will not fix missing deps", async () => {
      const outputChannel: OutputChannel = {
        appendLine: noop,
        show: noop,
      };
      await expect(
        fixDependencyIssues("non_existing_package_json_path", outputChannel)
      ).to.be.fulfilled;
    });
  });

  context("positive", () => {
    const packageJsonPath = resolve(
      "./test/packages-samples/positive/fix_missing_deps/package.json"
    );

    afterEach(() => {
      const packagePath = dirname(packageJsonPath);
      const nodeModulesPath = join(packagePath, "node_modules");
      const packageLockPath = join(packagePath, "package-lock.json");

      removeSync(nodeModulesPath);
      removeSync(packageLockPath);
    });

    it("will fix missing deps", async () => {
      const output: string[] = [];
      const outputChannel: OutputChannel = {
        appendLine: (data: string) => output.push(data),
        show: noop,
      };
      const problemsBeforeFix = await findDependencyIssues(packageJsonPath);
      expect(problemsBeforeFix).to.not.be.empty;

      await fixDependencyIssues(packageJsonPath, outputChannel);
      expect(last(output)).to.contain("Done fixing dependency issues");
      const problemsAfterFix = await findDependencyIssues(packageJsonPath);
      expect(problemsAfterFix).to.be.empty;
    }).timeout(npmSpawnTestTimeout);
  });
});
