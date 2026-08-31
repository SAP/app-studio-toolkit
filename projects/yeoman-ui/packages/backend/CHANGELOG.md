# yeoman-ui

## 1.27.1

### Patch Changes

- 865247c: support dynamic module loading in yo-env v3 wrapper

## 1.26.1

### Patch Changes

- fcde8b7: Fix yeoman-ui bug: run a generator and its composed sub-generators on a compatible yeoman-environment

  Generators are now instantiated on the legacy yeoman-environment (v3) runtime first, falling back to the modern (v6)
  runtime only when a generator can't run on v3. Because a generator and its composed sub-generators must share one
  runtime, probing the lowest compatible version first keeps the whole composition on a runtime every generator
  supports.

## 1.26.0

### Minor Changes

- a47e506: Support yeoman environment v3 and v6

  This makes the extension work with both legacy and modern yeoman generators (v3-v8).

## 1.25.2

### Patch Changes

- a03c35b: Replace shell-based path expansion with native Node.js resolution

  The `ApplicationWizard.installationLocation` setting is now resolved
  entirely in Node.js. Tilde (`~`), `$HOME`, and `%USERPROFILE%` prefixes
  are expanded without spawning a shell process, preserving backward
  compatibility with existing configurations.

  Generator install and uninstall operations now use `spawn()` with explicit
  argument arrays instead of building shell command strings, eliminating
  the shell as an intermediary for those operations. A shared `shellQuotePath`
  helper is used for the remaining elevated commands that require a shell
  (`icacls`, `chown`). The real username is resolved in Node.js before being
  passed to `sudo.exec` to ensure correct ownership on Linux and macOS.

  Additional fixes:

  - Prevent a crash when `installationLocation` is unset (default state)
  - Fix cross-platform test failures caused by hardcoded POSIX path separators
  - Fix `NODE_OPTIONS` assignment in npm scripts using `cross-env` for Windows compatibility

## 1.25.1

### Patch Changes

- 378a1b3: Release yeoman-ui (uses updated inquirer-gui libraries)
- Updated dependencies [378a1b3]
  - @sap-devx/yeoman-ui-types@1.25.1
