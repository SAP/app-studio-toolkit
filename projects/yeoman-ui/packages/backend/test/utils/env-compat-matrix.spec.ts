import { expect } from "chai";
import { join, dirname } from "path";
import {
  readdirSync,
  readFileSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { createRequire } from "module";
import { Env } from "../../src/utils/env.js";
import { Constants } from "../../src/utils/constants.js";

const require = createRequire(import.meta.url);

const GENERATOR_MAJORS = [
  {
    label: "v3",
    pkg: "yeoman-generator-v3",
    shipsIncompatibilityLiteral: false,
  },
  {
    label: "v4",
    pkg: "yeoman-generator-v4",
    shipsIncompatibilityLiteral: true,
  },
  {
    label: "v5",
    pkg: "yeoman-generator-v5",
    shipsIncompatibilityLiteral: true,
  },
  {
    label: "v6",
    pkg: "yeoman-generator-v6",
    shipsIncompatibilityLiteral: true,
  },
  {
    label: "v7",
    pkg: "yeoman-generator-v7",
    shipsIncompatibilityLiteral: true,
  },
  { label: "v8", pkg: "yeoman-generator", shipsIncompatibilityLiteral: true },
];

const ENVIRONMENTS = [
  {
    label: "env-v6",
    create: () =>
      require("yeoman-environment").createEnv({
        sharedOptions: { forwardErrorToEnvironment: true },
      }),
  },
  {
    label: "env-v3",
    create: () =>
      require("yeoman-env-v3").createV3Env(
        undefined,
        { sharedOptions: { forwardErrorToEnvironment: true } },
        undefined
      ),
  },
];

/** Recursively grep a generator package for its env-incompatibility literal. */
function findIncompatibilityLiteral(pkg: string): string | undefined {
  const pkgRoot = dirname(dirname(require.resolve(pkg))); // .../package/{lib|dist}/x.js -> package/
  const candidates: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules") continue;
      const full = join(dir, entry.name);

      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".js")) candidates.push(full);
    }
  };
  walk(pkgRoot);

  const re = new RegExp(
    Constants.ENV_INCOMPATIBILITY_MESSAGE_PREFIX.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    ) + "\\.?"
  );
  for (const file of candidates) {
    const match = re.exec(readFileSync(file, "utf8"));
    if (match) return match[0];
  }
  return undefined;
}

const MODULE_TYPES = [
  { label: "cjs", type: "commonjs" as const },
  { label: "esm", type: "module" as const },
];

/** Build an on-disk generator extending the given yeoman-generator major. */
function makeGenerator(
  pkg: string,
  moduleType: "commonjs" | "module"
): { resolved: string; packagePath: string } {
  const packagePath = mkdtempSync(join(tmpdir(), "gen-compat-"));
  const appDir = join(packagePath, "generators", "app");

  mkdirSync(appDir, { recursive: true });
  writeFileSync(
    join(packagePath, "package.json"),
    JSON.stringify({
      name: "generator-compat",
      version: "1.0.0",
      type: moduleType,
    })
  );

  const genMain = require.resolve(pkg);

  const source =
    moduleType === "module"
      ? `import { createRequire } from "module";\n` +
        `const require = createRequire(import.meta.url);\n` +
        `const G = require(${JSON.stringify(genMain)});\n` +
        `const Base = G.default || G;\n` +
        `export default class CompatProbe extends Base {\n` +
        `  initializing() { return "ok"; }\n` +
        `}\n`
      : `"use strict";\n` +
        `const G = require(${JSON.stringify(genMain)});\n` +
        `const Base = G.default || G;\n` +
        `module.exports = class CompatProbe extends Base {\n` +
        `  initializing() { return "ok"; }\n` +
        `};\n`;

  writeFileSync(join(appDir, "index.js"), source);

  return { resolved: join(appDir, "index.js"), packagePath };
}

describe("yeoman-generator × yeoman-environment compatibility matrix", () => {
  describe("Env.isEnvIncompatibilityError() matches the real string from every generator major", () => {
    for (const {
      label,
      pkg,
      shipsIncompatibilityLiteral,
    } of GENERATOR_MAJORS) {
      if (shipsIncompatibilityLiteral) {
        it(`recognizes the ${label} incompatibility message`, () => {
          const literal = findIncompatibilityLiteral(pkg);

          expect(
            literal,
            `${pkg} should ship an env-incompatibility literal`
          ).to.be.a("string");
          expect(
            (Env as any).isEnvIncompatibilityError(new Error(literal)),
            `env.ts must classify the ${label} incompatibility string as a v3-fallback signal`
          ).to.equal(true);
        });
      } else {
        it(`${label} ships no incompatibility message (predates the env feature check)`, () => {
          expect(
            findIncompatibilityLiteral(pkg),
            `${pkg} is not expected to emit the env-incompatibility string`
          ).to.equal(undefined);
        });
      }
    }
  });

  describe("real generator instantiation across supported environments", () => {
    for (const { label: genLabel, pkg } of GENERATOR_MAJORS) {
      for (const env of ENVIRONMENTS) {
        for (const moduleType of MODULE_TYPES) {
          it(`generator ${genLabel} (${moduleType.label}) on ${env.label}`, async function () {
            this.timeout(15000);
            const { resolved, packagePath } = makeGenerator(
              pkg,
              moduleType.type
            );
            const namespace = "compat:app";

            let outcome: { ok: boolean; message?: string };
            try {
              const environment = env.create();
              environment.register(resolved, {
                namespace,
                packagePath,
              });
              let gen = environment.create(namespace, { options: {} });

              if (gen && typeof gen.then === "function") gen = await gen;
              outcome = { ok: true };
            } catch (error) {
              outcome = { ok: false, message: (error as Error).message };
            }

            if (!outcome.ok) {
              const message = outcome.message ?? "";
              const isIncompat = (Env as any).isEnvIncompatibilityError(
                new Error(message)
              );
              // yeoman-generator v7+ rejects an older env by version, not by the
              // feature check
              const isVersionMismatch = message.includes(
                "requires yeoman-environment"
              );
              // An ESM generator run on the v3 env fails when v3 tries to mutate
              // the frozen ESM module namespace ("resolved" property). This is a
              // module-format incompatibility distinct from the two above
              const isFrozenEsmModule = message.includes(
                "object is not extensible"
              );

              expect(
                isIncompat || isVersionMismatch || isFrozenEsmModule,
                `unexpected failure for ${genLabel} (${moduleType.label}) on ${env.label}: ${message}`
              ).to.equal(true);

              if (isVersionMismatch || isFrozenEsmModule) {
                expect(
                  isIncompat,
                  `a ${
                    isFrozenEsmModule ? "frozen-ESM" : "version-mismatch"
                  } error must not be classified as env-incompatibility`
                ).to.equal(false);
              }

              if (isFrozenEsmModule) {
                expect(
                  moduleType.label === "esm" && env.label === "env-v3",
                  `frozen-ESM error only expected for ESM generators on env-v3, got ${genLabel} (${moduleType.label}) on ${env.label}`
                ).to.equal(true);
              }
            }
          });
        }
      }
    }
  });
});
