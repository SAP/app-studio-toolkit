const path = require("path");

const WEBIDE_IGNORED = [
  /^packages\/webide-client-tools\/(resources|example)\//,
  /^packages\/webide-client-tools\/test\/(resources|resources2|resources_amd_check)\//,
  /^packages\/webide-client-tools\/.*\.d\.ts$/,
];

function filterWebideIgnored(files) {
  const cwd = process.cwd();
  return files.filter((f) => {
    const rel = path.relative(cwd, f).replace(/\\/g, "/");
    return !WEBIDE_IGNORED.some((p) => p.test(rel));
  });
}

module.exports = {
  "*.{js,ts,json,md}": ["prettier --write"],
  "*.{ts,js}": (files) => {
    const filtered = filterWebideIgnored(files);
    if (filtered.length === 0) return [];
    return [
      `eslint --fix --max-warnings=0 --ignore-pattern=!.* ${filtered.join(
        " "
      )}`,
    ];
  },
};
