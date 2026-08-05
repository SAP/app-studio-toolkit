# Compose fixtures

Generators used by `test/utils/env.spec.ts` to exercise `Env.createRunGen()`
end-to-end across the two yeoman-environment runtimes it can route to.

## How routing works

`createRunGen` probes the **lower** runtime (yeoman-environment **v3**) first,
then falls back to **v6**. A generator composes its sub-generators onto the same
environment it runs on, so the whole tree shares one runtime; probing the lowest
version first finds the lowest runtime every generator in the composition can run
on.

- A generator based on **yeoman-generator v3-v6** instantiates on the **v3**
  runtime, so the whole composition runs on v3.
- A generator based on **yeoman-generator v7+** (or an ESM generator) cannot
  instantiate on v3, so the composition falls back to and runs on the **v6**
  runtime.

The `-vN` suffix in each fixture name is the **yeoman-generator** major it
extends (via the `yeoman-generator-vN` alias in `package.json`); the runtime it
lands on follows from that per the rules above.

## Layout

Each scenario is a self-contained folder with a `top/` package (the generator
`createRunGen` runs) that composes a `sub/` package.

### positive/ - the composition runs to completion

| scenario                | top    | sub    | runtime |
| ----------------------- | ------ | ------ | ------- |
| `top-gen-v5-sub-gen-v5` | gen v5 | gen v5 | v3      |
| `top-gen-v8-sub-gen-v8` | gen v8 | gen v8 | v6      |

### negative/ - the run fails with an expected error

| scenario                     | top    | sub                        | runtime | expected error                |
| ---------------------------- | ------ | -------------------------- | ------- | ----------------------------- |
| `top-gen-v8-sub-gen-v3-only` | gen v8 | gen v3, needs env v3       | v6      | "necessary feature"           |
| `top-gen-v3-sub-gen-v8-only` | gen v3 | gen v8, needs env >= 4     | v3      | "requires yeoman-environment" |
| `top-gen-v5-sub-throws`      | gen v5 | gen v5, `writing()` throws | v3      | "blew up on purpose"          |

`top-gen-v8-sub-gen-v3-only` mirrors the real `@sap/fiori:adp` regression: a
composition that lands on a runtime one of its sub-generators cannot use.
