---
"yeoman-ui": patch
"guided-development": patch
---

Pin `@sap-devx/webview-rpc` back to the versions consumed before PR #614 (yeoman-ui: 0.4.1, guided-development: 0.3.1). The migration bumped these to 1.1.0, whose `invoke(method, ...params)` signature is incompatible with the array-style `invoke(method, params[])` calls throughout these packages, which stopped yeoman-ui from loading (#673).
