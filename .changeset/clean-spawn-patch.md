---
"yeoman-ui": patch
---

Replace shell-based path expansion with native Node.js resolution

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
