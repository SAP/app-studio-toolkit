import { expect } from "chai";
import { resolve, join, dirname } from "path";
import { rmdirSync, unlinkSync } from "fs";
import { OutputChannel } from "../src/types";
import { fixDependencyIssues, findDependencyIssues } from "../src/api";
import { doesPathExist } from "../src/utils/fileUtil";
import { npmSpawnTestTimeout } from "./config";

describe("`fixDependencyIssues()` function ", function () {
  const outputChannel: OutputChannel = {
    appendLine: (data: string) => console.log(data),
  };

  context("negative", () => {
    it("will not fix missing deps", async () => {
      await expect(fixDependencyIssues("non_existing_package_json_path")).to.be
        .fulfilled;
    });
  });

  context("positive", () => {
    const packageJsonPath = resolve(
      "./test/packages-samples/positive/fix_missing_deps/package.json"
    );

    afterEach(async () => {
      const packagePath = dirname(packageJsonPath);
      const nodeModulesPath = join(packagePath, "node_modules");

      if (await doesPathExist(nodeModulesPath)) {
        rmdirSync(nodeModulesPath, { recursive: true });
      }

      const packageLockPath = join(packagePath, "package-lock.json");
      if (await doesPathExist(packageLockPath)) {
        unlinkSync(packageLockPath);
      }
    });

    it("will fix missing deps", async function () {
      this.timeout(npmSpawnTestTimeout * 2);

      const { problems: problemsBeforeFix } = await findDependencyIssues(
        packageJsonPath
      );
      const jsonFixerProblem = problemsBeforeFix.find((problem) =>
        problem.startsWith("missing: json-fixer@1.6.12")
      );
      expect(jsonFixerProblem).to.exist;

      await fixDependencyIssues(packageJsonPath, outputChannel);

      const { problems: problemsAfterFix } = await findDependencyIssues(
        packageJsonPath
      );
      expect(problemsAfterFix).to.be.empty;
    });
  });
});
