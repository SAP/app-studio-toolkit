// by avoiding parsing (and transformations) or webpack on this file
//   - see webpack.config.js
// we allow access to the native requirejs functionality for modules which import
// this `native-require` file.
export const nativeRequire: NodeRequire = require;
