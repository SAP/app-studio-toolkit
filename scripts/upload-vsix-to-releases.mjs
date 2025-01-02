/**
 * For Dev flows:
 *   1. Create .env json in this script's directory
 *   2. add the env variables checked below to the .env file
 *   3. Run the script directly in your IDE or terminal.
 *   4. [Optionally] use https://github.com/nektos/act to run the script in "local" gh-actions context
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { Octokit } from "octokit";
import dotenv from "dotenv";
const __dirname = import.meta.dirname;
// dontenv is only used in local testing flows, so local scripts dir is used for `.env` file
dotenv.config({ path: resolve(__dirname, ".env") });

if (process.env.GITHUB_TOKEN === undefined) {
  throw new Error("GH_TOKEN is required in env");
}
const ghToken = process.env.GITHUB_TOKEN;

if (process.env.PKG_LIST === undefined) {
  throw new Error("PKG_LIST is required in env");
}
// @type { {name: string, version: string}[] },
//   - e.g: [{name: "ext1", version: "1.0.0"}, {name: "ext2", version: "2.0.0"}]
const pkgList = JSON.parse(process.env.PKG_LIST);

// GITHUB_REPOSITORY structure is: "[owner]/[repo]",
//   - e.g: "microsoft/vscode"
if (process.env.GITHUB_REPOSITORY === undefined) {
  throw new Error("GITHUB_REPOSITORY is required in env");
}
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

const octokit = new Octokit({ auth: ghToken });
const ghReleases = await octokit.paginate(octokit.rest.repos.listReleases, {
  owner,
  repo,
});
console.log(`found ${ghReleases.length} GH Releases`);

const errors = [];
function logError(err) {
  errors.push(err);
  console.log(err);
}

for (const { name, version } of pkgList) {
  console.log(`Searching for release ${name}@${version}`);
  const matchingRelease = ghReleases.find(
    (r) => r.name === `${name}@${version}`
  );
  if (matchingRelease === undefined) {
    logError(`No release found for ${name}@${version}`);
    continue; // don't fail fast, try to upload other assets first.
  }

  const artifactPath = vsixArtifactForRelease(name, version);
  if (existsSync(artifactPath)) {
    console.log(`Found artifact ${artifactPath} to upload for ${name}@${version} release`);
    try {
      console.log(`reading artifact ${artifactPath}`);
      const data = await readFile(artifactPath);
      await uploadArtifact({
        uploadUrl: matchingRelease.upload_url,
        name,
        version,
        releaseID: matchingRelease.id,
        data,
      });
    } catch (err) {
      logError(`failed to upload ${name}@${version}: ${err}`);
    }
  }
}

if (errors.length > 0) {
  throw new Error(`Failed to upload some assets: ${errors.join(", ")}`);
}

async function uploadArtifact({ uploadUrl, name, version, releaseID, data }) {
  console.log(`Uploading ${name}@${version} to ${uploadUrl}`);
  const uploadResult = await octokit.rest.repos.uploadReleaseAsset({
    owner,
    repo,
    url: uploadUrl,
    data: data,
    headers: {
      "content-type": "application/zip",
    },
    name: `${name}-${version}.vsix`,
    release_id: releaseID,
  });
  console.log(`upload status code: ${uploadResult.status}`);
}

function vsixArtifactForRelease(name, version) {
  const artifactPath = resolve(
    __dirname,
    "..",
    "packages",
    name,
    `${name}-${version}.vsix`
  );
  return artifactPath;
}
