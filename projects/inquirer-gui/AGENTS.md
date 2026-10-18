# Inquirer GUI

This component belongs to the app-studio-toolkit pnpm workspace. Read the root
agent guidance and this project's README before changing it.

- Architecture: Vue 3 form rendering lives in `packages/inquirer-gui/src/Form.vue`;
  navigation lives in `packages/controls-navigator/src/NavigatorControl.vue`.
  Other `packages/*` directories provide question plugins; `examples/` contains consumers.
- Install with `pnpm install` at the monorepo root. Use Node 24.x and the root's
  pinned pnpm 11.1.1. Root `pnpm ci` validates the workspace in dependency order.
- For core or navigator changes, run `pnpm build` and `pnpm test` in that package.
  Builds use Vite; tests use Jest. Inspect other package manifests before choosing
  commands: `tiles-plugin`, for example, has no test script.
- Keep plugin question-type names and Vue registration consistent with consumer
  question objects. Public configuration is passed through props and callbacks.
- Release versions are managed by the root `.changeset/config.json`; do not treat
  this nested directory as an independent repository or release pipeline.
