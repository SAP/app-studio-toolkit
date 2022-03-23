function activate(): void {
  // In the node dependencies upgrade scenario only metadata is provided
  // in the extension's package.json, so the activate method is **empty**
}

module.exports = {
  activate,
};
