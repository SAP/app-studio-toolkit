import { vscode } from "./vscodeProxy.js";

const ENV_VAR = "YEOMAN_UI_LEGACY_GENERATORS";
const CONFIG_SECTION = "ApplicationWizard";
const CONFIG_KEY = "legacyGenerators";

/**
 * Returns the merged legacy-generator include list from two sources:
 *
 *  1. The `YEOMAN_UI_LEGACY_GENERATORS` environment variable (comma or JSON
 *     array). Wins when the same generator appears in both — operators use it
 *     to override VSCode settings landscape-wide without a hotfix release.
 *  2. The `ApplicationWizard.legacyGenerators` VSCode setting (array of
 *     strings). Users tweak this per-workspace / per-user.
 *
 * Each entry is a **namespace prefix**. A generator whose namespace starts
 * with `<entry>:` or equals `<entry>` runs under the legacy yeoman-environment
 * v3 runtime.
 *
 * An empty list means all generators use the default v6 runtime.
 */
export function getLegacyGeneratorList(): string[] {
  const list = new Set<string>();

  const envRaw = process.env[ENV_VAR];
  if (envRaw && envRaw.trim().length > 0) {
    for (const entry of parseListLoosely(envRaw)) {
      list.add(entry);
    }
  }

  // In the extension host `vscode` is the real API; in tests / dev flow it is
  // the mock defined in vscodeProxy — both expose `workspace.getConfiguration`,
  // so the same lookup path works everywhere.
  try {
    const configured = vscode.workspace
      ?.getConfiguration(CONFIG_SECTION)
      ?.get<string[]>(CONFIG_KEY);
    if (Array.isArray(configured)) {
      for (const entry of configured) {
        if (typeof entry === "string" && entry.trim().length > 0) {
          list.add(entry.trim());
        }
      }
    }
  } catch {
    // getConfiguration can throw in narrow lifecycle windows (activation
    // race). Fall back to env-var-only list — safer than crashing the flow.
  }

  return Array.from(list);
}

/**
 * Whether a generator namespace should route to the legacy v3 runtime.
 *
 * Matches an entry when the namespace equals it or is a colon-delimited
 * descendant.
 */
export function isLegacyNamespace(
  genNamespace: string,
  list = getLegacyGeneratorList()
): boolean {
  return list.some(
    (entry) => genNamespace === entry || genNamespace.startsWith(`${entry}:`)
  );
}

function parseListLoosely(raw: string): string[] {
  const trimmed = raw.trim();
  // Accept a JSON array — the env-var may carry structured payloads set by
  // orchestration tooling.
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((s): s is string => typeof s === "string")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      }
    } catch {
      // fall through to comma-splitting
    }
  }
  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
