import { spawn } from "child_process";
import { resolve, join } from "path";
import { access, readFile } from "fs/promises";
import { constants } from "fs";
import { ProblematicDependency, ProblemType } from "./api";

export class ProjectValidator {
  private readonly NPM = /^win/.test(process.platform) ? "npm.cmd" : "npm";
  private readonly LS_DEPS = ["ls", "--depth=0", "--json"]; // dependencies and extraneous modules
  private readonly LS_DEV_DEPS = [...this.LS_DEPS, "--dev"]; // devDependencies

  private async isValidJsonFile(packageJsonPath: string): Promise<boolean> {
    try {
      const packageJsonContent = await readFile(packageJsonPath, "utf-8");
      JSON.parse(packageJsonContent);
      return true;
    } catch (error: any) {
      console.debug(
        `${packageJsonPath} file content is invalid. ${
          error.stack || error.message
        }`
      );
      return false;
    }
  }

  private async isPathExist(packageJsonPath: string): Promise<boolean> {
    try {
      await access(packageJsonPath, constants.R_OK | constants.W_OK);
      return true;
    } catch (error: any) {
      console.debug(
        `${packageJsonPath} file is not accessible. ${
          error.stack || error.message
        }`
      );
      return false;
    }
  }

  private async getDepsStatus(path: string, devDeps: boolean): Promise<any> {
    const resolvedPath = resolve(path);
    const packageJsonPath = join(resolve(path), "package.json");

    if (!(await this.isPathExist(packageJsonPath))) return Promise.resolve({});
    if (!(await this.isValidJsonFile(packageJsonPath)))
      return Promise.resolve({});

    return new Promise((resolve, reject) => {
      const ls = spawn(
        this.NPM,
        devDeps ? [...this.LS_DEV_DEPS] : [...this.LS_DEPS],
        { cwd: resolvedPath }
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

  private getProblemType(dependency: any): ProblemType | undefined {
    if (dependency.missing) return "missing";
    if (dependency.invalid) return "invalid";
    if (dependency.extraneous) return "extraneous";
  }

  private async getProblemticDeps(
    path: string,
    devDeps = false
  ): Promise<ProblematicDependency[]> {
    const { dependencies } = await this.getDepsStatus(path, devDeps);

    const problematicDeps: ProblematicDependency[] = [];
    for (const name in dependencies) {
      const dependency = dependencies[name];
      const problemType = this.getProblemType(dependency);
      if (problemType) {
        const version = dependency.version ?? dependency.required;
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

// TODO: check in BAS on big project CAP or UI5 or Fiori

// TODO: meeting with Ido about performance problems

// create vscode extension in app-studio-toolkit and show errors only for first level package.json projects
// probably use git repos that we talked about for json line search (see in Teams)
