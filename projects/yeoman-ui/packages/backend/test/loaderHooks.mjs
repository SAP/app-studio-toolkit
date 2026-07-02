// ts-node/esm does not respect the "import" exports condition for packages without
// "type":"module". This hook forces @sap-devx/yeoman-ui-types to its ESM build.
const TYPES_ESM = new URL(
  "../../types/dist/esm/src/index.js",
  import.meta.url
).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "@sap-devx/yeoman-ui-types") {
    return { url: TYPES_ESM, format: "module", shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
