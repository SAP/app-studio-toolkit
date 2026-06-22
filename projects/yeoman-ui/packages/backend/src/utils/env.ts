import * as _ from "lodash";
import * as path from "path";
import * as fs from "fs";
import { NpmCommand } from "./npm";
import * as customLocation from "./customLocation";
import Environment, { createEnv } from "yeoman-environment";
import type { EnvironmentOptions } from "yeoman-environment";
import type { LookupGeneratorMeta } from "@yeoman/types";
import { IChildLogger } from "@vscode-logging/logger";
import { getClassLogger } from "../logger/logger-wrapper";

const GENERATOR = "generator-";
const NAMESPACE = "namespace";

// Detects whether a generator requires yeoman-environment v3 (legacy) or v6 (modern)
//
// Detection strategy:
// 1. Private node_modules copy: read yeoman-generator/package.json from the generator's
//    own node_modules subtree — version major ≤ 5 → legacy
// 2. Declared dep range: read the generator's own package.json dependencies field —
//    covers generators that webpack-bundled their deps (no node_modules subfolder)
// 3. Bundle scan: read the generator's resolved entry file and look for `env.runLoop` —
//    the exact property name checked by yeoman-generator ≤ v5
function isLegacyGenerator(meta: LookupGeneratorMeta): boolean {
  // --- Check 1: private node_modules copy ---
  const nodeModulesRoots = [
    path.join(meta.packagePath, "node_modules"),
    path.join(path.dirname(meta.resolved), "node_modules"),
  ];

  for (const root of nodeModulesRoots) {
    const pkgJson = path.join(root, "yeoman-generator", "package.json");

    try {
      const version: string =
        JSON.parse(fs.readFileSync(pkgJson, "utf8")).version ?? "";
      const major = parseInt(version.split(".")[0], 10);

      return !isNaN(major) && major <= 5;
    } catch {
      // not present at this root, try next check
    }
  }

  // --- Check 2: declared dependency range in generator's package.json ---
  // Handles generators that bundled deps and may not have a node_modules subfolder
  try {
    const genPkg = JSON.parse(
      fs.readFileSync(path.join(meta.packagePath, "package.json"), "utf8")
    );
    const range: string =
      (genPkg.dependencies ?? {})["yeoman-generator"] ??
      (genPkg.devDependencies ?? {})["yeoman-generator"] ??
      (genPkg.peerDependencies ?? {})["yeoman-generator"] ??
      "";

    if (range) {
      const firstDigit = parseInt(
        range.replace(/^[^0-9]*/, "").split(".")[0],
        10
      );

      return !isNaN(firstDigit) && firstDigit <= 5;
    }
  } catch {
    // generator has no readable package.json, try next check
  }

  // --- Check 3: scan resolved entry file for env.runLoop usage ---
  // yeoman-generator ≤ v5 checks `env.runLoop` in its constructor — this property name
  // is structural and survives minification. Generators that fully
  // bundle their deps (no node_modules, no dep in package.json) still carry this pattern
  try {
    const bundle = fs.readFileSync(meta.resolved, "utf8");

    return bundle.includes("env.runLoop");
  } catch {
    // unreadable entry file
  }

  return false;
}

function namespaceToName(ns: string): string {
  const base = ns.replace(/:.*$/, "");
  return base.startsWith("@")
    ? base.replace(/\/generator-/, "/")
    : base.replace(/^generator-/, "");
}

export type EnvGen = {
  env: Environment;
  gen: any;
};

export type GeneratorData = {
  generatorMeta: LookupGeneratorMeta;
  generatorPackageJson: any;
};

type AdditionalGenerator = {
  namespace: string;
  displayName: string;
  description: string;
  homePage?: string;
  image?: string;
};

export class GeneratorNotFoundError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class EnvUtil {
  private logger: IChildLogger;
  private allInstalledGensMeta: LookupGeneratorMeta[];

  constructor() {
    try {
      this.logger = getClassLogger(EnvUtil.name);
    } catch (e) {
      // nothing TODO : testing scope
    }
  }

  public loadNpmPath() {
    return this;
  }

  private createEnvInstance(
    opts?: EnvironmentOptions,
    adapter?: any
  ): Environment {
    return createEnv({ ...opts, ...(adapter ? { adapter } : {}) });
  }

  private unloadGeneratorModules(genNamespace: string): void {
    let generatorName;
    const genShortName = namespaceToName(genNamespace);
    if (genShortName.startsWith("@")) {
      const firstSlashIndex: number = genShortName.indexOf("/");
      generatorName = `${GENERATOR}${genShortName.substring(
        firstSlashIndex + 1
      )}`;
    } else {
      generatorName = `${GENERATOR}${genShortName}`;
    }

    const keys = Object.keys(require.cache);
    for (const key of keys) {
      if (key.includes(generatorName)) {
        delete require.cache[key];
      }
    }
  }

  private async lookupGensMeta(
    options?: Parameters<Environment["lookup"]>[0]
  ): Promise<LookupGeneratorMeta[]> {
    return this.createEnvInstance().lookup(options);
  }

  // returns installed generators meta from global and custom installation location
  // custom installation generators have priority over global installed generators when names are identical
  private async lookupAllGensMeta(): Promise<LookupGeneratorMeta[]> {
    const globallyInstalledGensMeta = await this.lookupGensMeta();

    const customNpmPath = customLocation.getNodeModulesPath();
    const customInstalledGensMeta = _.isEmpty(customNpmPath)
      ? []
      : await this.lookupGensMeta({ npmPaths: [customNpmPath] });

    const gensMeta = _.unionBy(
      customInstalledGensMeta,
      globallyInstalledGensMeta,
      NAMESPACE
    );
    return _.orderBy(gensMeta, [NAMESPACE], ["asc"]);
  }

  private async getGenMetadata(
    genNamespace: string
  ): Promise<LookupGeneratorMeta> {
    this.allInstalledGensMeta = await this.lookupAllGensMeta();

    const genMetadata = this.allInstalledGensMeta.find(
      (genMeta) => genMeta.namespace === genNamespace
    );
    if (genMetadata) {
      return genMetadata;
    }

    throw new GeneratorNotFoundError(
      `${genNamespace} generator metadata was not found.`
    );
  }

  private genMainGensMeta(
    gensMeta: LookupGeneratorMeta[]
  ): LookupGeneratorMeta[] {
    return gensMeta.filter((genMeta) => genMeta.namespace.endsWith(":app"));
  }

  private async getGensMetaByInstallationPath(): Promise<
    LookupGeneratorMeta[]
  > {
    const npmInstallationPaths = [
      customLocation.getNodeModulesPath() ??
        (await NpmCommand.getGlobalNodeModulesPath()),
    ];
    return this.lookupGensMeta({ npmPaths: npmInstallationPaths });
  }

  private async getGeneratorsMeta(
    mainOnly = true
  ): Promise<LookupGeneratorMeta[]> {
    this.allInstalledGensMeta = await this.lookupAllGensMeta();
    return mainOnly
      ? this.genMainGensMeta(this.allInstalledGensMeta)
      : this.allInstalledGensMeta;
  }

  public async getAllGeneratorNamespaces(): Promise<string[]> {
    const gensMeta: LookupGeneratorMeta[] = await this.getGeneratorsMeta(false);
    return _.map(gensMeta, (genMeta) => genMeta.namespace);
  }

  public async createEnvAndGen(
    genNamespace: string,
    options: any,
    adapter: any
  ): Promise<EnvGen> {
    const meta: LookupGeneratorMeta = await this.getGenMetadata(genNamespace);
    this.unloadGeneratorModules(genNamespace);

    if (isLegacyGenerator(meta)) {
      return this.createLegacyEnvAndGen(genNamespace, meta, options, adapter);
    }

    const env: Environment = this.createEnvInstance(
      {
        sharedOptions: { forwardErrorToEnvironment: true } as Record<
          string,
          any
        >,
      },
      adapter
    );

    env.register(meta.resolved, {
      namespace: genNamespace,
      packagePath: meta.packagePath,
    });
    const gen: any = await env.create(genNamespace, { options } as any);

    return { env, gen };
  }

  private createLegacyEnvAndGen(
    genNamespace: string,
    meta: LookupGeneratorMeta,
    options: any,
    adapter: any
  ): EnvGen {
    // Load yeoman-environment v3 from the bundled yeoman-env-compat.js file.
    // __non_webpack_require__ bypasses the webpack bundle and uses Node's native require,
    // resolving relative to the extension's dist/ directory at runtime
    const compat = __non_webpack_require__("./yeoman-env-compat"); // eslint-disable-line @typescript-eslint/no-var-requires

    // yeoman-environment v3: createEnv() is synchronous and accepts an adapter as the
    // second argument. env.register() takes a resolved path and a namespace string
    const env = compat.createEnv(
      undefined,
      { sharedOptions: { forwardErrorToEnvironment: true } },
      adapter
    );
    env.register(meta.resolved, genNamespace);
    const gen = env.create(genNamespace, { options });

    return { env, gen };
  }

  public async getGeneratorsData(mainOnly = true): Promise<GeneratorData[]> {
    const gensMeta: LookupGeneratorMeta[] = await this.getGeneratorsMeta(
      mainOnly
    );
    const packageJsons = await NpmCommand.getPackageJsons(gensMeta);

    const gensData: GeneratorData[] = _.compact(
      packageJsons.map(
        (generatorPackageJson: any | undefined, index: number) => {
          if (generatorPackageJson) {
            const generatorMeta = gensMeta[index];
            return { generatorMeta, generatorPackageJson };
          }
        }
      )
    );

    // lookup for additional generators
    let additional: AdditionalGenerator[] = [];
    gensData.forEach((genData) => {
      additional = additional.concat(
        ...(genData.generatorPackageJson.additional_generators ?? [])
      );
    });
    // remove duplicates
    additional = _.uniqBy(additional, "namespace");
    // get additional generators data
    if (additional.length) {
      const additionalGensMeta = this.allInstalledGensMeta.filter((genMeta) =>
        additional.find((gen) => gen.namespace === genMeta.namespace)
      );
      const additionalPackageJsons = await NpmCommand.getPackageJsons(
        additionalGensMeta
      );
      const additionalGensData = additionalPackageJsons.map(
        (generatorPackageJson: any | undefined, index: number) => {
          if (generatorPackageJson) {
            return {
              generatorMeta: additionalGensMeta[index],
              // populate additional generator properties with main generator package.json
              generatorPackageJson: {
                ...generatorPackageJson,
                ...additional[index],
              },
            };
          }
        }
      );
      gensData.push(...additionalGensData);
    }

    return gensData;
  }

  public async getGeneratorNamesWithOutdatedVersion(): Promise<string[]> {
    const gensMeta: LookupGeneratorMeta[] =
      await this.getGensMetaByInstallationPath();
    return NpmCommand.getPackageNamesWithOutdatedVersion(
      this.genMainGensMeta(gensMeta)
    );
  }

  public getGeneratorFullName(genNamespace: string): string {
    const genName = namespaceToName(genNamespace);
    const parts = _.split(genName, "/");
    return _.size(parts) === 1
      ? `${GENERATOR}${genName}`
      : `${parts[0]}/${GENERATOR}${parts[1]}`;
  }
}

export const Env = new EnvUtil();
