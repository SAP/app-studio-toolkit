import { createSandbox, SinonSandbox } from "sinon";
import { expect } from "chai";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createRequire } from "module";
import { EventEmitter } from "events";
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

const composeTopFixture = {
  namespace: "compose-top:app",
  packagePath: resolve(FIXTURES, "generator-compose-top"),
  resolved: resolve(FIXTURES, "generator-compose-top/generators/app/index.js"),
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
    expect(
      (env as any).getVersion(),
      "the returned env is yeoman-environment v6"
    ).to.match(/^6\./);
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

  it("isEnvIncompatibilityError matches the incompatibility text even when wrapped", () => {
    const wrapped = new Error(
      `Could not call '@bas-dev/generator-extensibility-sub' sub-generator: ${Constants.ENV_INCOMPATIBILITY_MESSAGE_PREFIX}.`
    );
    expect((Env as any).isEnvIncompatibilityError(wrapped)).to.equal(true);
    expect(
      (Env as any).isEnvIncompatibilityError(new Error("some other failure")),
      "an unrelated error is not treated as an env-incompatibility"
    ).to.equal(false);
  });
});

describe("Env.createRunGen()", () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
    // createRunGen resolves metadata + reloads modules; keep those inert
    sandbox.stub(Env as any, "getGenMetadata").resolves(metaFor(envV6Fixture));
    sandbox.stub(Env as any, "unloadGeneratorModules");
  });

  afterEach(() => {
    sandbox.restore();
  });

  function fakeEnv(behavior: { reject?: Error }): any {
    const emitter = new EventEmitter();
    return Object.assign(emitter, {
      runGenerator(): Promise<void> {
        return behavior.reject
          ? Promise.reject(behavior.reject)
          : Promise.resolve();
      },
    });
  }

  function fakeAdapter(): any {
    return {
      resetSignal(): void {
        return undefined;
      },
    };
  }

  it("runs on v3 when the generator can be instantiated on v3", async () => {
    const v3Create = sandbox
      .stub(Env as any, "createLegacyV3EnvAndGen")
      .returns({ env: fakeEnv({}), gen: { id: "v3" } });
    const v6Create = sandbox.stub(Env as any, "createV6EnvAndGen");

    const prepare = sandbox.stub();
    await Env.createRunGen(
      envV6Fixture.namespace,
      { silent: true },
      fakeAdapter(),
      prepare
    );

    expect(v3Create.calledOnce, "the generator was created on v3").to.equal(
      true
    );
    expect(
      v6Create.called,
      "v6 is not attempted when v3 create succeeds"
    ).to.equal(false);
    expect(prepare.calledOnce, "prepare wired the v3 env/gen").to.equal(true);
    expect(prepare.firstCall.args[1]).to.deep.equal({ id: "v3" });
  });

  it("resets the adapter signal before the run", async () => {
    sandbox
      .stub(Env as any, "createLegacyV3EnvAndGen")
      .returns({ env: fakeEnv({}), gen: { id: "v3" } });

    const resetSignal = sandbox.stub();
    await Env.createRunGen(
      envV6Fixture.namespace,
      { silent: true },
      { resetSignal },
      sandbox.stub()
    );

    expect(resetSignal.calledOnce, "a fresh signal is prepared").to.equal(true);
  });

  it("runs on v6 when the generator cannot be instantiated on v3", async () => {
    const v3Create = sandbox
      .stub(Env as any, "createLegacyV3EnvAndGen")
      .throws(
        new Error(
          "This generator requires yeoman-environment at least 4.0.0-rc.0"
        )
      );
    const v6Create = sandbox
      .stub(Env as any, "createV6EnvAndGen")
      .resolves({ env: fakeEnv({}), gen: { id: "v6" } });

    const prepare = sandbox.stub();
    await Env.createRunGen(
      envV6Fixture.namespace,
      { silent: true },
      fakeAdapter(),
      prepare
    );

    expect(v3Create.calledOnce, "v3 create was probed first").to.equal(true);
    expect(v6Create.calledOnce, "the generator ran on v6").to.equal(true);
    expect(prepare.calledOnce, "prepare wired the v6 env/gen").to.equal(true);
    expect(prepare.firstCall.args[1]).to.deep.equal({ id: "v6" });
  });

  it("surfaces the v6 error when the generator fails on v3 create AND on v6", async () => {
    sandbox
      .stub(Env as any, "createLegacyV3EnvAndGen")
      .throws(new Error("requires yeoman-environment at least 4.0.0-rc.0"));
    const V6_ERROR = "v6 run blew up for its own reason";
    sandbox.stub(Env as any, "createV6EnvAndGen").rejects(new Error(V6_ERROR));

    let thrown: any;
    try {
      await Env.createRunGen(
        envV6Fixture.namespace,
        { silent: true },
        fakeAdapter(),
        sandbox.stub()
      );
    } catch (error) {
      thrown = error;
    }

    expect(thrown?.message, "the v6 error is surfaced").to.contain(V6_ERROR);
  });

  it("surfaces a v3 run error", async () => {
    const V3_RUN_ERROR = "v3 generator writing() blew up";
    sandbox
      .stub(Env as any, "createLegacyV3EnvAndGen")
      .returns({ env: fakeEnv({ reject: new Error(V3_RUN_ERROR) }), gen: {} });
    const v6Create = sandbox.stub(Env as any, "createV6EnvAndGen");

    let thrown: any;
    try {
      await Env.createRunGen(
        envV6Fixture.namespace,
        { silent: true },
        fakeAdapter(),
        sandbox.stub()
      );
    } catch (error) {
      thrown = error;
    }

    expect(thrown?.message, "the v3 run error is surfaced").to.contain(
      V3_RUN_ERROR
    );
    expect(
      v6Create.called,
      "v6 is not tried after a successful v3 create"
    ).to.equal(false);
  });

  it("surfaces a v3 CREATE error as-is (does NOT route to v6) when it is not a runtime-incompatibility signal", async () => {
    // A legacy generator whose constructor throws for its own reason (e.g.
    // @bas-dev/extensibility-sub run standalone -> `"undefined" is not valid
    // JSON`). This is a real v3 error, not a "needs v6" signal, so it must
    // surface directly - routing to v6 would produce a misleading
    // env-incompatibility error instead.
    const V3_BUG = '"undefined" is not valid JSON';
    sandbox
      .stub(Env as any, "createLegacyV3EnvAndGen")
      .throws(new Error(V3_BUG));
    const v6Create = sandbox.stub(Env as any, "createV6EnvAndGen");

    let thrown: any;
    try {
      await Env.createRunGen(
        envV6Fixture.namespace,
        { silent: true },
        fakeAdapter(),
        sandbox.stub()
      );
    } catch (error) {
      thrown = error;
    }

    expect(thrown?.message, "the original v3 error is surfaced").to.contain(
      V3_BUG
    );
    expect(
      v6Create.called,
      "a non-incompatibility v3 error must NOT trigger a v6 attempt"
    ).to.equal(false);
  });

  it("routes to v6 only when the v3 create error IS a runtime-incompatibility signal", async () => {
    sandbox
      .stub(Env as any, "createLegacyV3EnvAndGen")
      .throws(new Error("requires yeoman-environment at least 4.0.0-rc.0"));
    const v6Create = sandbox
      .stub(Env as any, "createV6EnvAndGen")
      .resolves({ env: fakeEnv({}), gen: { id: "v6" } });

    const prepare = sandbox.stub();
    await Env.createRunGen(
      envV6Fixture.namespace,
      { silent: true },
      fakeAdapter(),
      prepare
    );

    expect(v6Create.calledOnce, "the generator ran on v6").to.equal(true);
    expect(prepare.firstCall.args[1]).to.deep.equal({ id: "v6" });
  });
});

describe("Env.createRunGen() - real compose regression", () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
    sandbox
      .stub(Env as any, "getGenMetadata")
      .resolves(metaFor(composeTopFixture));
    // Use the bundled v3 runtime for the real v3 path.
    sandbox
      .stub(Env as any, "loadLegacyV3Compat")
      .returns(require("yeoman-env-v3"));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("routes a legacy top generator to v3 and runs its composed sub-generator to completion", async function () {
    this.timeout(15000);

    const marker = { subRan: false };
    const options = { silent: true, composeMarker: marker };
    // Minimal adapter; v3 ignores the v6 hooks.
    const log: any = (): void => undefined;
    log.info = (): void => undefined;
    log.error = (): void => undefined;
    log.writeln = (): void => undefined;
    const adapter: any = {
      log,
      prompt: (): Promise<any> => Promise.resolve({}),
      diff: (): string => "",
      colorDiffAdded: (s: string): string => s,
      colorDiffRemoved: (s: string): string => s,
      resetSignal: (): void => undefined,
    };

    const v6Create = sandbox.spy(Env as any, "createV6EnvAndGen");

    let capturedEnv: any;
    await Env.createRunGen(
      composeTopFixture.namespace,
      options,
      adapter,
      (env: any): void => {
        capturedEnv = env;
      }
    );

    expect(
      (capturedEnv as any)?.getVersion?.(),
      "the top generator ran on the yeoman-environment v3 runtime"
    ).to.match(/^3\./);
    expect(
      marker.subRan,
      "the composed sub-generator's writing phase actually ran"
    ).to.equal(true);
    expect(
      v6Create.called,
      "a legacy generator does not touch the v6 runtime"
    ).to.equal(false);
  });
});
