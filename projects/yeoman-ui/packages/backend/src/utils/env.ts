import _ from "lodash";
import { createRequire } from "module";
import { NpmCommand } from "./npm.js";
import * as customLocation from "./customLocation.js";
import Environment, { createEnv } from "yeoman-environment";
import type {
  LookupGeneratorMeta,
  BaseEnvironmentOptions,
  InputOutputAdapter,
} from "@yeoman/types";
import type { IChildLogger } from "@vscode-logging/logger";
import type * as YeomanEnvV3 from "yeoman-env-v3";
import { getClassLogger } from "../logger/logger-wrapper.js";
import { isLegacyNamespace, namespaceToName } from "./legacyGenerators.js";

const _require = createRequire(import.meta.url);

const GENERATOR = "generator-";
const NAMESPACE = "namespace";

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
  private legacyCompat: typeof YeomanEnvV3 | undefined;

  constructor() {
    try {
      this.logger = getClassLogger(EnvUtil.name);
    } catch (e) {
      // nothing TODO : testing scope
    }
  }

  public loadNpmPath(_force = false) {
    return this;
  }

  private createEnvInstance(
    opts?: BaseEnvironmentOptions,
    adapter?: InputOutputAdapter
  ): Environment {
    return createEnv({ ...opts, ...(adapter ? { adapter } : {}) });
  }

  private unloadGeneratorModules(genNamespace: string): void {
    let generatorName;
    const genShortName = namespaceToName(genNamespace);
    if (genShortName.startsWith("@")) {
      const firstSlashIndex = genShortName.indexOf("/");
      generatorName = `${GENERATOR}${genShortName.substring(
        firstSlashIndex + 1
      )}`;
    } else {
      generatorName = `${GENERATOR}${genShortName}`;
    }

    const keys = Object.keys(_require.cache);
    for (const key of keys) {
      if (key.includes(generatorName)) {
        delete _require.cache[key];
      }
    }
  }

  private lookupGensMeta(
    options?: Parameters<Environment["lookup"]>[0]
  ): Promise<LookupGeneratorMeta[]> {
    return this.createEnvInstance().lookup(options);
  }

  // Returns installed generators meta from global and custom installation location.
  // Custom installation generators have priority over global installed generators
  // when names are identical
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

    // Fast path: namespace is in the include list → route straight to v3.
    // This avoids the wasted work of trying v6 first for known-legacy
    // generators and skips the wall-clock cost of a failed v6.create().
    if (isLegacyNamespace(genNamespace)) {
      this.logger?.info(
        `routing generator ${genNamespace} to legacy yeoman-environment v3 (matched include list)`
      );
      return this.createLegacyEnvAndGen(genNamespace, meta, options, adapter);
    }

    // Default path: try v6 first. If it throws while instantiating (typical
    // symptom for v4/v5-shape generators under v6), fall back to v3. This
    // makes the include list a *performance hint*, not a *filter*: users
    // still see all their generators, unlisted-legacy ones just pay a small
    // first-run cost. Operators can add explicit entries once they identify
    // which packages are legacy to eliminate the retry.
    this.logger?.debug(
      `routing generator ${genNamespace} to yeoman-environment v6`
    );

    try {
      const env: Environment = this.createEnvInstance(
        { sharedOptions: { forwardErrorToEnvironment: true } as any },
        adapter
      );

      env.register(meta.resolved!, {
        namespace: genNamespace,
        packagePath: meta.packagePath,
      });

      const gen: any = await env.create(genNamespace, { options } as any);

      return { env, gen };
    } catch (error) {
      this.logger?.info(
        `yeoman-environment v6 could not create ${genNamespace}, falling back to legacy v3`,
        { error: (error as Error)?.message }
      );
      return this.createLegacyEnvAndGen(genNamespace, meta, options, adapter);
    }
  }

  /**
   * Legacy code path: load yeoman-environment v3 from the pre-bundled compat
   * package at runtime and use its v3-shape API. The compat bundle is copied
   * into the extension's `dist/` folder next to `extension.js` at build time.
   *
   * v3's `env.create()` is synchronous — no await here. v3's `register()`
   * takes a raw namespace string rather than the metadata object v6 accepts.
   */
  private createLegacyEnvAndGen(
    genNamespace: string,
    meta: LookupGeneratorMeta,
    options: any,
    adapter: any
  ): EnvGen {
    if (!this.legacyCompat) {
      this.legacyCompat = __non_webpack_require__(
        "./yeoman-env-v3.cjs"
      ) as typeof YeomanEnvV3;
    }

    const env = this.legacyCompat.createEnv(
      undefined,
      { sharedOptions: { forwardErrorToEnvironment: true } },
      adapter
    );
    env.register(meta.resolved, genNamespace);
    const gen = env.create(genNamespace, { options });

    return { env: env as unknown as Environment, gen };
  }

  public async getGeneratorsData(mainOnly = true): Promise<GeneratorData[]> {
    const gensMeta: LookupGeneratorMeta[] = await this.getGeneratorsMeta(
      mainOnly
    );
    const packageJsons = await NpmCommand.getPackageJsons(gensMeta);

    const gensData = packageJsons.map(
      (generatorPackageJson: any | undefined, index: number) => {
        if (generatorPackageJson) {
          const generatorMeta = gensMeta[index];
          return { generatorMeta, generatorPackageJson };
        }
      }
    );

    // lookup for additional generators
    let additional: AdditionalGenerator[] = [];
    gensData.forEach((genData) => {
      additional = additional.concat(
        ...(genData?.generatorPackageJson.additional_generators ?? [])
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

    return _.compact(gensData);
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
