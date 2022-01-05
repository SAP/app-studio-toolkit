module.exports = {
  include: "**/src/**",
  // No integration or end to end tests currently in this project.
  // `extension.ts` only contains minimal integration code with VSCode.
  // and can be "safely" excluded.
  exclude: ["src/extension.ts", "src/commands.ts"],
};
