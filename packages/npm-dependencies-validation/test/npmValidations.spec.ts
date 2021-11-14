import { ProjectValidator } from "../src/index";

describe("ProjectValidator unit test", () => {
  it("no_deps_installed", async () => {
    const pv = new ProjectValidator();
    const result = await pv.getProblematicDependencies(
      "./projects/no_deps/installed"
    );
    debugger;
  });
});
