import { createSandbox, SinonSandbox } from "sinon";
import { expect } from "chai";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createRequire } from "module";
import { Env } from "../../src/utils/env.js";
import { Constants } from "../../src/utils/constants.js";
import type { LookupGeneratorMeta } from "@yeoman/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const FIXTURES = resolve(__dirname, "../fixtures");

const envV6Fixture = {
  namespace: "env-v6-fixture:app",
  packagePath: resolve(FIXTURES, "generator-env-v6-fixture"),
  resolved: resolve(
    FIXTURES,
    "generator-env-v6-fixture/generators/app/index.js"
  ),
};

const envV3Fixture = {
  namespace: "env-v3-fixture:app",
  packagePath: resolve(FIXTURES, "generator-env-v3-fixture"),
  resolved: resolve(
    FIXTURES,
    "generator-env-v3-fixture/generators/app/index.js"
  ),
};

const envV6InitErrorFixture = {
  namespace: "env-v6-init-error-fixture:app",
  packagePath: resolve(FIXTURES, "generator-env-v6-init-error-fixture"),
  resolved: resolve(
    FIXTURES,
    "generator-env-v6-init-error-fixture/generators/app/index.js"
  ),
};

/** Build a LookupGeneratorMeta the way env.ts consumes it. */
function metaFor(fixture: {
  namespace: string;
  packagePath: string;
  resolved: string;
}): LookupGeneratorMeta {
  return {
    namespace: fixture.namespace,
    packagePath: fixture.packagePath,
    resolved: fixture.resolved,
    registered: true,
  } as unknown as LookupGeneratorMeta;
}

describe("Env.createEnvAndGen()", () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("loads a generator through yeoman-environment v6", async () => {
    // Point metadata resolution at the v6 fixture; let the real v6 env
    // register + create it (no fallback).
    sandbox.stub(Env as any, "getGenMetadata").resolves(metaFor(envV6Fixture));

    const { env, gen } = await Env.createEnvAndGen(
      envV6Fixture.namespace,
      { silent: true },
      undefined
    );

    expect(env, "a v6 environment instance is returned").to.be.an("object");
    expect(gen, "a generator instance is returned").to.be.an("object");
    expect(
      gen.constructor.name,
      "the v6 fixture class was instantiated"
    ).to.equal("EnvV6FixtureGenerator");
  });

  it("falls back to yeoman-environment v3 when v6 cannot create the generator", async () => {
    sandbox.stub(Env as any, "getGenMetadata").resolves(metaFor(envV3Fixture));

    // Force the v6 path to fail with the exact env-incompatibility message
    // yeoman-generator throws when a generator is run on the wrong runtime —
    // this is the only signal that triggers the v3 fallback.
    const failingV6Env: any = {
      register(): void {
        return undefined;
      },
      create(): never {
        throw new Error(`${Constants.ENV_INCOMPATIBILITY_MESSAGE_PREFIX}.`);
      },
    };
    sandbox.stub(Env as any, "createEnvInstance").returns(failingV6Env);

    sandbox
      .stub(Env as any, "loadLegacyV3Compat")
      .returns(require("yeoman-env-v3"));

    const { env, gen } = await Env.createEnvAndGen(
      envV3Fixture.namespace,
      { silent: true },
      undefined
    );

    expect(env, "a v3 environment instance is returned").to.be.an("object");
    expect(gen, "a generator instance is returned").to.be.an("object");
    expect(
      gen.constructor.name,
      "the v3 fixture class was instantiated by the v3 runtime"
    ).to.equal("EnvV3FixtureGenerator");
    expect(
      gen.envV3FixtureLoaded,
      "the v3 fixture's constructor actually ran"
    ).to.equal(true);
  });

  it("does not fall back to v3 when v6 fails with a generator domain error", async () => {
    sandbox
      .stub(Env as any, "getGenMetadata")
      .resolves(metaFor(envV6InitErrorFixture));

    const v3Fallback = sandbox.stub(Env as any, "createLegacyV3EnvAndGen");

    const { V6_INIT_ERROR } = require(envV6InitErrorFixture.resolved);

    let thrown: any;
    try {
      await Env.createEnvAndGen(
        envV6InitErrorFixture.namespace,
        { silent: true },
        undefined
      );
    } catch (error) {
      thrown = error;
    }

    expect(thrown, "createEnvAndGen should reject").to.be.instanceOf(Error);
    expect(
      thrown?.message,
      "the original v6 domain error is surfaced as-is"
    ).to.contain(V6_INIT_ERROR);
    expect(
      v3Fallback.called,
      "the v3 fallback must NOT run for a v6 domain error"
    ).to.equal(false);
  });

  it("surfaces the v3 fallback error (with the v6 error attached) when the incompatible generator also fails on v3", async () => {
    sandbox.stub(Env as any, "getGenMetadata").resolves(metaFor(envV3Fixture));

    const failingV6Env: any = {
      register(): void {
        return undefined;
      },
      create(): never {
        throw new Error(`${Constants.ENV_INCOMPATIBILITY_MESSAGE_PREFIX}.`);
      },
    };
    sandbox.stub(Env as any, "createEnvInstance").returns(failingV6Env);

    const V3_FALLBACK_ERROR = "v3 fallback failed for its own reason";
    sandbox
      .stub(Env as any, "createLegacyV3EnvAndGen")
      .throws(new Error(V3_FALLBACK_ERROR));

    let thrown: any;
    try {
      await Env.createEnvAndGen(
        envV3Fixture.namespace,
        { silent: true },
        undefined
      );
    } catch (error) {
      thrown = error;
    }

    expect(thrown, "createEnvAndGen should reject").to.be.instanceOf(Error);
    expect(
      thrown?.message,
      "the v3 fallback error is surfaced to the user, not the v6 error"
    ).to.contain(V3_FALLBACK_ERROR);
    // The v6 error is preserved as context for diagnostics.
    expect(
      thrown?.v6Error?.message,
      "the original v6 incompatibility error is attached for diagnostics"
    ).to.contain(`${Constants.ENV_INCOMPATIBILITY_MESSAGE_PREFIX}.`);
  });
});
