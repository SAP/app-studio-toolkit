"use strict";

const assert = require("node:assert");
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

console.log("yeoman-env-v3 bundle smoke test passed");
