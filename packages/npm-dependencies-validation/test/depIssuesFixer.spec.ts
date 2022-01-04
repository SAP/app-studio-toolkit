import { expect } from "chai";
import { resolve, join } from "path";
import { rmdirSync, rmSync } from "fs";
import { OutputChannel } from "../src/types";
import { fixDependencyIssues, findDependencyIssues } from "../src/api";

describe("`fixDependencyIssues()` function ", function () {
  const outputChannel: OutputChannel = {
    append: (data: string) => console.log(data),
    appendLine: (data: string) => console.log(`${data}\n`),
  };

  const packagePath = resolve(
    "./test/packages-samples/positive/fix_missing_deps"
  );

  afterEach(() => {
    const nodeModulesPath = join(packagePath, "node_modules");
    rmdirSync(nodeModulesPath, { recursive: true });

    const packageLockPath = join(packagePath, "package-lock.json");
    rmSync(packageLockPath, { recursive: true });
  });

  it("will fix missing deps", async function () {
    this.timeout(20000);

    const { problems: problemsBeforeFix } = await findDependencyIssues(
      packagePath
    );
    const jsonFixerProblem = problemsBeforeFix.find((problem) =>
      problem.startsWith("missing: json-fixer@1.6.12")
    );
    expect(jsonFixerProblem).to.exist;

    await fixDependencyIssues(packagePath, outputChannel);

    const { problems: problemsAfterFix } = await findDependencyIssues(
      packagePath
    );
    expect(problemsAfterFix).to.be.empty;
  });
});
