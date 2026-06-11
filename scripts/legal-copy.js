/**
 * Copies LICENSES/ and .reuse/ from the repo root into every intermediate
 * "project" directory that sits between the root and its pnpm workspace
 * packages (e.g. projects/yeoman-ui/).
 *
 * A directory qualifies as an intermediate project dir when it is an ancestor
 * of one or more workspace packages but is not itself the repo root.
 *
 * Usage (called from root package.json scripts):
 *   node scripts/legal-copy.js copy   -- copy LICENSES and .reuse
 *   node scripts/legal-copy.js delete -- remove LICENSES and .reuse
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const [, , command] = process.argv;

function projectDirs() {
  const raw = execSync("pnpm ls -r --depth -1 --json", {
    cwd: ROOT,
    encoding: "utf8",
  });
  const packages = JSON.parse(raw);
  const packagePaths = new Set(packages.map((p) => p.path));
  const dirs = new Set();

  for (const { path: pkgPath } of packages) {
    if (!pkgPath || pkgPath === ROOT) continue;
    // `pnpm -r exec -- shx cp -r ../../X X` copies from two levels up.
    // For packages nested more than 2 levels below root the "two levels up"
    // target is an intermediate project dir, not the root itself.
    // We need to pre-populate those intermediate dirs with the legal files.
    const twoUp = path.resolve(pkgPath, "../..");
    if (twoUp !== ROOT && !packagePaths.has(twoUp)) {
      dirs.add(twoUp);
    }
  }
  return [...dirs];
}

const dirs = projectDirs();

if (command === "copy") {
  for (const dir of dirs) {
    fs.cpSync(path.join(ROOT, "LICENSES"), path.join(dir, "LICENSES"), {
      recursive: true,
    });
    fs.cpSync(path.join(ROOT, ".reuse"), path.join(dir, ".reuse"), {
      recursive: true,
    });
    console.log(`Copied legal files → ${path.relative(ROOT, dir)}/`);
  }
} else if (command === "delete") {
  for (const dir of dirs) {
    fs.rmSync(path.join(dir, "LICENSES"), { recursive: true, force: true });
    fs.rmSync(path.join(dir, ".reuse"), { recursive: true, force: true });
    console.log(`Removed legal files from ${path.relative(ROOT, dir)}/`);
  }
} else {
  console.error("Usage: legal-copy.js copy|delete");
  process.exit(1);
}
