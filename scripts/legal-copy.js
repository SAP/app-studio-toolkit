/**
 * Distributes the repo-root LICENSES/ and .reuse/ directories into every
 * workspace package so REUSE/legal metadata travels with each packaged
 * artifact. These copies are git-ignored everywhere except the repo root, so
 * they are build-time only and safe to (re)create or remove idempotently.
 *
 * Package discovery uses @manypkg/get-packages, which understands the pnpm
 * workspace layout directly — no assumptions about how deeply packages are
 * nested.
 *
 * Usage (called from root package.json scripts):
 *   node scripts/legal-copy.js copy   -- copy LICENSES and .reuse
 *   node scripts/legal-copy.js delete -- remove LICENSES and .reuse
 */

const fs = require("fs");
const path = require("path");
const { getPackagesSync } = require("@manypkg/get-packages");

const ROOT = path.resolve(__dirname, "..");
const LEGAL_DIRS = ["LICENSES", ".reuse"];
const [, , command] = process.argv;

function packageDirs() {
  const { packages } = getPackagesSync(ROOT);
  return packages.map((pkg) => pkg.dir).filter((dir) => dir !== ROOT);
}

const dirs = packageDirs();

if (command === "copy") {
  for (const dir of dirs) {
    for (const legalDir of LEGAL_DIRS) {
      fs.cpSync(path.join(ROOT, legalDir), path.join(dir, legalDir), {
        recursive: true,
      });
    }
    console.log(`Copied legal files → ${path.relative(ROOT, dir)}/`);
  }
} else if (command === "delete") {
  for (const dir of dirs) {
    for (const legalDir of LEGAL_DIRS) {
      fs.rmSync(path.join(dir, legalDir), { recursive: true, force: true });
    }
    console.log(`Removed legal files from ${path.relative(ROOT, dir)}/`);
  }
} else {
  console.error("Usage: legal-copy.js copy|delete");
  process.exit(1);
}
