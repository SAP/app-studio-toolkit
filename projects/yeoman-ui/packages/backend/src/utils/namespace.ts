// Yeoman namespaces may include a sub-generator suffix, e.g. "generator-foo:app"
export function namespaceToName(namespace: string): string {
  const packageNamespace = namespace.replace(/:.*$/, "");

  if (packageNamespace.startsWith("@")) {
    return packageNamespace.replace("/generator-", "/");
  }

  return packageNamespace.replace(/^generator-/, "");
}
