/**
 * Naive implementation of optional-require.
 * It does not deal with all edge cases, e.g differentiate between:
 * 1. a module which does not exist.
 * 2. a module which exists but throws an error on initialization.
 *
 * But our use cases are simple enough that this naive implementation should suffice.
 * And this resolves bundling issue around the combination of:
 * - webpack
 * - optional-require npm package
 * - pnpm (which creates sym-links in node_modules)
 * - vsce vsix packager (which does **not** copy contents of sym-links).
 *
 */
export function optionalRequire<M = unknown>(
  moduleName: string
): M | undefined {
  try {
    const modulePath = require.resolve(moduleName);
    if (modulePath) {
      return require(moduleName) as M;
    } else {
      return undefined;
    }
  } catch (e) {
    return undefined;
  }
}
