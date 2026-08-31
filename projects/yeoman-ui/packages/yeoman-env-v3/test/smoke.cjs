"use strict";

const assert = require("node:assert");
const { mkdtempSync, mkdirSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { createV3Env } = require("../dist/index.js");

assert.strictEqual(
  typeof createV3Env,
  "function",
  "dist/index.js must export a createV3Env function"
);

const env = createV3Env(undefined, { sharedOptions: {} }, undefined);

for (const method of ["register", "create", "lookup", "runGenerator"]) {
  assert.strictEqual(
    typeof env[method],
    "function",
    `the bundled v3 environment must expose ${method}()`
  );
}

// runLoop is the structural property yeoman-generator v4 checks for; its
// presence confirms the v3 environment bundled with its internals intact
assert.ok(env.runLoop, "the bundled v3 environment must have a runLoop");

const packagePath = mkdtempSync(join(tmpdir(), "yeoman-env-v3-smoke-"));
const appDir = join(packagePath, "generators", "app");
mkdirSync(appDir, { recursive: true });
const generatorPath = join(appDir, "index.mjs");

writeFileSync(
  generatorPath,
  `export default class SmokeMjsGenerator {
  constructor(args, options) {
    this.args = args;
    this.options = options;
  }
}
`
);

env.register(generatorPath, {
  namespace: "smoke:app",
  packagePath,
});

(async () => {
  const gen = await env.create("smoke:app", { options: { smoke: true } });

  assert.strictEqual(
    gen.constructor.name,
    "SmokeMjsGenerator",
    "the bundled v3 environment must load .mjs generators with native import()"
  );
  assert.strictEqual(gen.options.smoke, true);

  console.log("yeoman-env-v3 bundle smoke test passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
