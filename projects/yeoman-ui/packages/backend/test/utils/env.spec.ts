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

type Fixture = { namespace: string; packagePath: string; resolved: string };

const standaloneGenV8Fixture: Fixture = {
  namespace: "standalone-gen-v8:app",
  packagePath: resolve(FIXTURES, "standalone/gen-v8"),
  resolved: resolve(FIXTURES, "standalone/gen-v8/generators/app/index.js"),
};

// The real compose regression scenarios, discovered from the
// fixtures/compose/{positive,negative}/<name>/top package layout (see the
// README there). Each scenario's `top` generator composes its sibling `sub`.
// The table drives the data-generated tests below: every scenario asserts the
// runtime it lands on, whether the composed sub ran, and (for negatives) the
// substring the surfaced error must contain
type ComposeScenario = {
  name: string;
  outcome: "positive" | "negative";
  // The yeoman-environment major the whole composition should route to
  runtime: 3 | 6;
  // Whether the composed sub-generator's writing phase is expected to complete
  subRan: boolean;
  // For negatives, a substring the surfaced error message must contain
  errorContains?: string;
  // Human-readable description of what the scenario proves
  it: string;
  fixture: Fixture;
};

function composeScenario(
  outcome: "positive" | "negative",
  name: string,
  expected: {
    runtime: 3 | 6;
    subRan: boolean;
    errorContains?: string;
    it: string;
  }
): ComposeScenario {
  const dir = `compose/${outcome}/${name}/top`;
  return {
    name,
    outcome,
    ...expected,
    fixture: {
      namespace: `${name}:app`,
      packagePath: resolve(FIXTURES, dir),
      resolved: resolve(FIXTURES, dir, "generators/app/index.js"),
    },
  };
}

const COMPOSE_SCENARIOS: ComposeScenario[] = [
  composeScenario("positive", "top-gen-v5-sub-gen-v5", {
    runtime: 3,
    subRan: true,
    it: "routes a legacy (v5) top generator to v3 and runs its composed v5 sub-generator to completion",
  }),
  composeScenario("positive", "top-gen-v8-sub-gen-v8", {
    runtime: 6,
    subRan: true,
    it: "routes a modern (v8) top generator to v6 and runs its composed v8 sub-generator to completion",
  }),
  composeScenario("negative", "top-gen-v8-sub-gen-v3-only", {
    runtime: 6,
    subRan: false,
    errorContains: "necessary feature",
    it: "surfaces the sub-generator error when a modern (v8) top composes a v3-only sub-generator on v6",
  }),
  composeScenario("negative", "top-gen-v3-sub-gen-v8-only", {
    runtime: 3,
    subRan: false,
    errorContains: "requires yeoman-environment",
    it: "surfaces the sub-generator error when a legacy (v3) top composes a v8-only sub-generator on v3",
  }),
  composeScenario("negative", "top-gen-v5-sub-throws", {
    runtime: 3,
    subRan: false,
    errorContains: "blew up on purpose",
    it: "surfaces a composed sub-generator's own writing-phase error",
  }),
]; /** Build a LookupGeneratorMeta the way env.ts consumes it. */
function metaFor(fixture: Fixture): LookupGeneratorMeta {
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
    sandbox
      .stub(Env as any, "getGenMetadata")
      .resolves(metaFor(standaloneGenV8Fixture));
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
      standaloneGenV8Fixture.namespace,
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
      standaloneGenV8Fixture.namespace,
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
      standaloneGenV8Fixture.namespace,
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
        standaloneGenV8Fixture.namespace,
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
        standaloneGenV8Fixture.namespace,
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
        standaloneGenV8Fixture.namespace,
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
      standaloneGenV8Fixture.namespace,
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

  // Run a scenario's top generator through createRunGen and report the runtime
  // it landed on + whether the composed sub ran + any surfaced error.
  async function runScenario(
    scenario: ComposeScenario
  ): Promise<{ envVersion?: string; subRan: boolean; error?: Error }> {
    sandbox
      .stub(Env as any, "getGenMetadata")
      .resolves(metaFor(scenario.fixture));

    const marker = { subRan: false };
    let capturedEnv: any;
    let error: Error | undefined;
    try {
      await Env.createRunGen(
        scenario.fixture.namespace,
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

  for (const scenario of COMPOSE_SCENARIOS) {
    it(scenario.it, async () => {
      const v6Create = sandbox.spy(Env as any, "createV6EnvAndGen");
      const { envVersion, subRan, error } = await runScenario(scenario);

      expect(
        envVersion,
        `the composition ran on the yeoman-environment v${scenario.runtime} runtime`
      ).to.match(new RegExp(`^${scenario.runtime}\\.`));

      expect(
        v6Create.called,
        scenario.runtime === 6
          ? "a modern composition is created on the v6 runtime"
          : "a legacy composition does not touch the v6 runtime"
      ).to.equal(scenario.runtime === 6);

      expect(
        subRan,
        scenario.subRan
          ? "the composed sub-generator's writing phase actually ran"
          : "the composed sub-generator did not complete"
      ).to.equal(scenario.subRan);

      if (scenario.outcome === "positive") {
        expect(error, "the composition runs without error").to.equal(undefined);
      } else {
        expect(error, "the run fails").to.be.instanceOf(Error);
        expect(
          error?.message,
          `the surfaced error contains "${scenario.errorContains}"`
        ).to.contain(scenario.errorContains);
      }
    });
  }
});
