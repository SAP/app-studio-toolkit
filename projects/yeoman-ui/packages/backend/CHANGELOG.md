# yeoman-ui

## 1.26.0

### Minor Changes

- a47e506: Support yeoman environment v3 and v6

  This makes the extension work with both legacy and modern yeoman generators (v3-v8).

### Patch Changes

- Updated dependencies [a47e506]
  - yeoman-env-v3@3.19.4

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
