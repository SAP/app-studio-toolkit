/**
 * Convert a generator namespace to its package short-name.
 *
 * Strips the sub-generator segment (everything after the first `:`), then the
 * `generator-` prefix — both for bare (`generator-foo:app` → `foo`) and scoped
 * (`@scope/generator-foo:app` → `@scope/foo`) namespaces
 */
export function namespaceToName(ns: string): string {
  const base = ns.replace(/:.*$/, "");
  return base.startsWith("@")
    ? base.replace(/\/generator-/, "/")
    : base.replace(/^generator-/, "");
}
