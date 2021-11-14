import { spawn } from "child_process";
import { ProblematicDependency, ProblemType } from "./api";

export class ProjectValidator {
  private readonly NPM = /^win/.test(process.platform) ? "npm.cmd" : "npm";
  private readonly LS_DEPS = ["ls", "--depth=0", "--json"]; // dependencies and extraneous modules
  private readonly LS_DEV_DEPS = [...this.LS_DEPS, "--dev"]; // devDependencies

  private getDepsStatus(path: string, devDeps: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      const ls = spawn(
        this.NPM,
        devDeps ? [...this.LS_DEV_DEPS] : [...this.LS_DEPS],
        { cwd: path }
      );

      ls.stdout.on("data", (data) => {
        const jsonObjResult = JSON.parse(data ?? "{}");
        resolve(jsonObjResult);
      });

      ls.on("error", (error) => {
        console.error(error);
        reject(error);
      });
    });
  }

  private getProblemType(dependency: any): ProblemType {
    if (dependency.missing) return "missing";
    if (dependency.invalid) return "invalid";

    return "extraneous";
  }

  private async getProblemticDeps(
    path: string,
    devDeps = false
  ): Promise<ProblematicDependency[]> {
    const { dependencies } = await this.getDepsStatus(path, devDeps);
    const problematicDeps: ProblematicDependency[] = [];
    for (const name in dependencies) {
      const dependency = dependencies[name];
      const version = dependency.version ?? dependency.required;
      const problemType = this.getProblemType(dependency);
      const problematicDep: ProblematicDependency = {
        name,
        version,
        problemType,
      };
      if (problemType != "extraneous") {
        problematicDep.isDevDependency = devDeps;
      }
      problematicDeps.push(problematicDep);
    }
    return problematicDeps;
  }

  public async getProblematicDependencies(
    path: string
  ): Promise<ProblematicDependency[]> {
    const results = await Promise.all([
      this.getProblemticDeps(path),
      this.getProblemticDeps(path, true),
    ]);
    return [...results[0], ...results[1]];
  }
}

const pv = new ProjectValidator();
void pv
  .getProblematicDependencies(
    "C:\\wing\\dep-validator\\test\\projects\\no_deps_installed"
  )
  .then((result: ProblematicDependency[]) => {
    console.log(`no_deps_installed: ${result}`);
  });
// pv.getStatus("C:\\wing\\dep-validator\\test\\projects\\some_deps_installed").then((result: any) => {
//     console.log(`some_deps_installed: ${result}`);
// });
// void pv.getStatus("C:\\wing\\dep-validator\\test\\projects\\some_deps_redundant").then((result: any) => {
//     console.log(`some_deps_redundant: ${result}`);
// });
console.time("deps status");
// void pv.getProblematicDependencies("C:\\wing\\yeoman-ui").then((result: any) => {
//     console.timeEnd("deps status");
//     console.log(`yeoman-ui: ${JSON.stringify(result, null, 2)}`);
// });

// TODO: spawn or exec ??

// TODO: check that package.json exists

// TODO: add one more example

// TODO: make test with broken package.json

// TODO: check in BAS on big project CAP or UI5 or Fiori

// TODO: meeting with Ido about performance problems

// use Shachars branch in app-studio-toolkit
// make packages private:true
// create 2 packages in app-studio-toolkit
// create tests and types for problems logic
// create vscode extension and show errors only for first level package.json projects
// probably use git repos that we talked about for json line search (see in Teams)
