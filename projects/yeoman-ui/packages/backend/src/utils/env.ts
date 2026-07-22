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
import { namespaceToName } from "./namespace.js";

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
  private static readonly ENV_V6_V3_INCOMPATIBILITY_MESSAGE =
    "Current environment doesn't provides some necessary feature this generator needs.";

  private logger: IChildLogger;
  private allInstalledGensMeta: LookupGeneratorMeta[];

  constructor() {
    try {
      this.logger = getClassLogger(EnvUtil.name);
    } catch (e) {
      // nothing TODO : testing scope
    }
  }

  private isEnvIncompatibilityError(error: unknown): boolean {
    return (
      (error as Error)?.message === EnvUtil.ENV_V6_V3_INCOMPATIBILITY_MESSAGE
    );
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

    // v6 is the default runtime; retry with v3 only on an env-incompatibility error
    this.logger?.debug(
      `routing generator ${genNamespace} to default yeoman-environment v6`
    );

    try {
      const v6Env: Environment = this.createEnvInstance(
        { sharedOptions: { forwardErrorToEnvironment: true } as any },
        adapter
      );

      v6Env.register(meta.resolved!, {
        namespace: genNamespace,
        packagePath: meta.packagePath,
      });

      const gen: any = await v6Env.create(genNamespace, { options } as any);

      return { env: v6Env, gen };
    } catch (v6Error) {
      if (!this.isEnvIncompatibilityError(v6Error)) {
        this.logger?.error(
          `yeoman-environment v6 failed to create ${genNamespace} with a non-compatibility error; not falling back to v3`,
          { error: (v6Error as Error)?.message }
        );
        throw v6Error;
      }

      this.logger?.info(
        `default yeoman-environment v6 could not create ${genNamespace}, falling back to yeoman-environment v3`,
        { error: (v6Error as Error)?.message }
      );
      try {
        return this.createLegacyV3EnvAndGen(
          genNamespace,
          meta,
          options,
          adapter
        );
      } catch (v3Error) {
        this.logger?.error(
          `yeoman-environment v3 fallback also failed for ${genNamespace}; surfacing the v3 error`,
          {
            v6Error: (v6Error as Error)?.message,
            v3Error: (v3Error as Error)?.message,
          }
        );

        v3Error.v6Error = v6Error;
        throw v3Error;
      }
    }
  }

  private createLegacyV3EnvAndGen(
    genNamespace: string,
    meta: LookupGeneratorMeta,
    options: any,
    adapter: any
  ): EnvGen {
    const legacyCompat = this.loadLegacyV3Compat();

    const v3Env = legacyCompat.createV3Env(
      undefined,
      { sharedOptions: { forwardErrorToEnvironment: true } },
      adapter
    );
    v3Env.register(meta.resolved, {
      namespace: genNamespace,
      packagePath: meta.packagePath,
    } as any);
    const gen = v3Env.create(genNamespace, {
      options,
    } as unknown as string[]);

    return { env: v3Env as unknown as Environment, gen };
  }

  private loadLegacyV3Compat(): typeof YeomanEnvV3 {
    return __non_webpack_require__("./yeoman-env-v3.cjs") as typeof YeomanEnvV3;
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
