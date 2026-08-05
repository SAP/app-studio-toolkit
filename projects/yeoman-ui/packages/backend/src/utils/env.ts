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
import { Constants } from "./constants.js";

const _require = createRequire(import.meta.url);

const GENERATOR = "generator-";
const NAMESPACE = "namespace";

export type EnvGen = {
  env: Environment;
  gen: any;
};

export type PrepareEnvGen = (
  env: Environment,
  gen: any
) => void | Promise<void>;

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

  public isEnvIncompatibilityError(error: unknown): boolean {
    return (
      (error as Error)?.message?.includes(
        Constants.ENV_INCOMPATIBILITY_MESSAGE_PREFIX
      ) ?? false
    );
  }

  // A generator that fails to instantiate on the legacy yeoman-environment v3
  // runtime for one of these two reasons actually needs the modern (v6) runtime,
  // so createRunGen falls back to v6 when it sees either signal:
  //
  // 1. "requires yeoman-environment" - yeoman-generator v7+ ships an explicit
  //    version guard that throws before construction, e.g.:
  //      "This generator (foo:app) requires yeoman-environment at least
  //       4.0.0-rc.0, current version is 3.19.3, try reinstalling latest
  //       version of 'yo' or use '--ignore-version-check' option"
  //    The "yeoman-environment" package name is hardcoded in that template, so
  //    the "requires yeoman-environment" substring is stable across generator
  //    versions; only the version numbers vary.
  //    NOTE for future multi-version support: if we ever ship more than two
  //    runtimes, we could parse the required version out of this message and
  //    jump straight to the matching env instead of probing v3 first.
  //
  // 2. "object is not extensible" - not a yeoman-specific string. It surfaces
  //    when an ESM generator is instantiated on the v3 environment: v3 tries to
  //    write a "resolved" property onto the generator module's frozen ESM
  //    namespace object, which throws. This is an ESM/CJS incompatibility, not
  //    a version guard.
  private isV3RuntimeIncompatibilityError(error: unknown): boolean {
    const message = (error as Error)?.message ?? "";
    return (
      message.includes("requires yeoman-environment") ||
      message.includes("object is not extensible")
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

  public async createRunGen(
    genNamespace: string,
    options: any,
    adapter: any,
    prepare: PrepareEnvGen
  ): Promise<void> {
    const meta: LookupGeneratorMeta = await this.getGenMetadata(genNamespace);

    this.unloadGeneratorModules(genNamespace);
    let v3EnvGen: EnvGen | undefined;
    // Try the LOWER runtime (yeoman-environment v3) first. A generator composes
    // sub-generators onto the same environment it runs on, so the whole tree has
    // to share one runtime; probing the lowest supported version first finds the
    // lowest runtime that every generator in the composition can run on.
    //
    // Concrete example: @sap/fiori:adp composes @bas-dev/generator-extensibility-sub.
    // The sub-generator needs a yeoman-environment v3-only feature and breaks on
    // v6. Both instantiate on v3, so probing v3 first keeps the whole run on v3
    // and the composition succeeds. If we probed v6 first, adp would run on v6
    // and the sub-generator would fail at writing() time - and because prompts
    // are already spent by then, an in-run retry on v3 is not possible.
    //
    // A generator that genuinely needs v6 (v7/v8 base, or ESM) cannot instantiate
    // on v3 and throws a runtime-incompatibility signal here, so we fall back to
    // v6 below. env.create() only constructs the generator (no prompting), so the
    // extra v3 probe is cheap and never double-prompts.
    try {
      v3EnvGen = this.createLegacyV3EnvAndGen(
        genNamespace,
        meta,
        options,
        adapter
      );
    } catch (v3CreateError) {
      if (this.isV3RuntimeIncompatibilityError(v3CreateError)) {
        this.logger?.info(
          `generator ${genNamespace} needs yeoman-environment v6; instantiation on v3 was rejected`,
          { error: (v3CreateError as Error)?.message }
        );
      } else {
        this.logger?.debug(
          `generator ${genNamespace} failed to instantiate on yeoman-environment v3; surfacing the error (not a v6-runtime signal)`,
          { error: (v3CreateError as Error)?.message }
        );
        throw v3CreateError;
      }
    }

    if (v3EnvGen) {
      this.logger?.debug(
        `routing generator ${genNamespace} to yeoman-environment v3`
      );
      await this.prepareAndRun(v3EnvGen.env, v3EnvGen.gen, adapter, prepare);
      return;
    }

    this.logger?.debug(
      `routing generator ${genNamespace} to yeoman-environment v6`
    );
    this.unloadGeneratorModules(genNamespace);
    const { env, gen } = await this.createV6EnvAndGen(
      genNamespace,
      meta,
      options,
      adapter
    );
    await this.prepareAndRun(env, gen, adapter, prepare);
  }

  private async prepareAndRun(
    env: Environment,
    gen: any,
    adapter: any,
    prepare: PrepareEnvGen
  ): Promise<void> {
    adapter?.resetSignal?.();
    await prepare(env, gen);
    await env.runGenerator(gen);
  }

  private async createV6EnvAndGen(
    genNamespace: string,
    meta: LookupGeneratorMeta,
    options: any,
    adapter: any
  ): Promise<EnvGen> {
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
