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

const composeTopFixture = {
  namespace: "compose-top:app",
  packagePath: resolve(FIXTURES, "generator-compose-top"),
  resolved: resolve(FIXTURES, "generator-compose-top/generators/app/index.js"),
};

const composeV6TopFixture = {
  namespace: "compose-v6-top:app",
  packagePath: resolve(FIXTURES, "generator-compose-v6-top"),
  resolved: resolve(
    FIXTURES,
    "generator-compose-v6-top/generators/app/index.js"
  ),
};

const composeV6TopV3SubFixture = {
  namespace: "compose-v6-top-v3sub:app",
  packagePath: resolve(FIXTURES, "generator-compose-v6-top-v3sub"),
  resolved: resolve(
    FIXTURES,
    "generator-compose-v6-top-v3sub/generators/app/index.js"
  ),
};

const composeV3TopV6SubFixture = {
  namespace: "compose-v3-top-v6sub:app",
  packagePath: resolve(FIXTURES, "generator-compose-v3-top-v6sub"),
  resolved: resolve(
    FIXTURES,
    "generator-compose-v3-top-v6sub/generators/app/index.js"
  ),
};

const composeTopFailingFixture = {
  namespace: "compose-top-failing:app",
  packagePath: resolve(FIXTURES, "generator-compose-top-failing"),
  resolved: resolve(
    FIXTURES,
    "generator-compose-top-failing/generators/app/index.js"
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

describe("Env.isEnvIncompatibilityError()", () => {
  it("matches the incompatibility text even when wrapped", () => {
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
    // Use the bundled v3 runtime for the real v3 path.
    sandbox
      .stub(Env as any, "loadLegacyV3Compat")
      .returns(require("yeoman-env-v3"));
  });

  afterEach(() => {
    sandbox.restore();
  });

  function makeAdapter(): any {
    const log: any = (): void => undefined;
    log.info = (): void => undefined;
    log.error = (): void => undefined;
    log.writeln = (): void => undefined;
    let ac = new AbortController();
    return {
      log,
      prompt: (): Promise<any> => Promise.resolve({}),
      diff: (): string => "",
      colorDiffAdded: (s: string): string => s,
      colorDiffRemoved: (s: string): string => s,
      resetSignal: (): void => {
        ac = new AbortController();
      },
      get signal(): AbortSignal {
        return ac.signal;
      },
      abort: (reason?: unknown): void => {
        if (!ac.signal.aborted) {
          ac.abort(reason);
        }
      },
      onIdle: (): Promise<void> => Promise.resolve(),
      progress: (fn: any): Promise<any> =>
        Promise.resolve(fn({ step: (): void => undefined })),
    };
  }

  // Run a fixture through createRunGen and report the runtime + outcome
  async function runFixture(fixture: {
    namespace: string;
    packagePath: string;
    resolved: string;
  }): Promise<{ envVersion?: string; subRan: boolean; error?: Error }> {
    sandbox.stub(Env as any, "getGenMetadata").resolves(metaFor(fixture));

    const marker = { subRan: false };
    let capturedEnv: any;
    let error: Error | undefined;
    try {
      await Env.createRunGen(
        fixture.namespace,
        { silent: true, composeMarker: marker },
        makeAdapter(),
        (env: any): void => {
          capturedEnv = env;
        }
      );
    } catch (e) {
      error = e as Error;
    }

    return {
      envVersion: capturedEnv?.getVersion?.(),
      subRan: marker.subRan,
      error,
    };
  }

  it("routes a legacy top generator to v3 and runs its composed sub-generator to completion", async () => {
    const v6Create = sandbox.spy(Env as any, "createV6EnvAndGen");
    const { envVersion, subRan, error } = await runFixture(composeTopFixture);

    expect(error, "the legacy v3 compose runs without error").to.equal(
      undefined
    );
    expect(
      envVersion,
      "the top generator ran on the yeoman-environment v3 runtime"
    ).to.match(/^3\./);
    expect(
      subRan,
      "the composed sub-generator's writing phase actually ran"
    ).to.equal(true);
    expect(
      v6Create.called,
      "a legacy generator does not touch the v6 runtime"
    ).to.equal(false);
  });

  it("routes a modern top generator to v6 and runs its composed v6 sub-generator to completion", async () => {
    const { envVersion, subRan, error } = await runFixture(composeV6TopFixture);

    expect(error, "the v6→v6 compose runs without error").to.equal(undefined);
    expect(
      envVersion,
      "the top generator ran on the yeoman-environment v6 runtime"
    ).to.match(/^6\./);
    expect(
      subRan,
      "the composed v6 sub-generator's writing phase actually ran"
    ).to.equal(true);
  });

  it("surfaces the sub-generator error when a v6 generator composes a v3-only sub-generator", async () => {
    const { envVersion, subRan, error } = await runFixture(
      composeV6TopV3SubFixture
    );

    expect(
      envVersion,
      "the modern top generator ran on the v6 runtime"
    ).to.match(/^6\./);
    expect(subRan, "the v3-only sub-generator did not complete").to.equal(
      false
    );
    expect(error, "the run fails").to.be.instanceOf(Error);
    expect(
      error?.message,
      "the v3-only feature error surfaces (matches the real @sap/fiori:adp regression)"
    ).to.contain("necessary feature");
  });

  it("surfaces the sub-generator error when a v3 generator composes a v6-only sub-generator", async () => {
    const { envVersion, subRan, error } = await runFixture(
      composeV3TopV6SubFixture
    );

    expect(
      envVersion,
      "the legacy top generator ran on the v3 runtime"
    ).to.match(/^3\./);
    expect(subRan, "the v6-only sub-generator did not complete").to.equal(
      false
    );
    expect(error, "the run fails").to.be.instanceOf(Error);
    expect(
      error?.message,
      "the v6-only sub-generator's version guard surfaces"
    ).to.contain("requires yeoman-environment");
  });

  it("surfaces a composed sub-generator's own writing-phase error", async () => {
    const { subRan, error } = await runFixture(composeTopFailingFixture);

    expect(subRan, "the failing sub-generator did not complete").to.equal(
      false
    );
    expect(error, "the run fails").to.be.instanceOf(Error);
    expect(
      error?.message,
      "the sub-generator's writing() error surfaces to the caller"
    ).to.contain("blew up on purpose");
  });
});
