# xml-toolkit

## 1.3.2

### Patch Changes

- 6c9d137: Fix the XML language server client crash on activation. The client (`vscode-languageclient@6.1.3`) bare-imports `vscode-languageserver-protocol` and needs its Node entry, which `3.18.x` moved behind an `exports` subpath, so `IPCMessageReader` was `undefined`. Pin the protocol to `3.16.0` for the `xml-toolkit` package.

## 1.3.1

### Patch Changes

- Updated dependencies [dc00463]
  - @xml-tools/language-server@1.2.1
