"use strict";

const fs = require('fs');
const event = JSON.parse(fs.readFileSync('/github/workflow/event.json').toString())
const semver = require("semver");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);

function highestReleaseType(labels = []) {
  // Possible release types
  // 'major' | 'premajor' | 'minor' | 'preminor' | 'patch' | 'prepatch' | 'prerelease'
  const major = labels.includes("major") || labels.includes("Major");
  if (major) {
    return "major";
  }
  const minor = labels.includes("minor") || labels.includes("Minor");
  if (minor) {
    return "minor";
  }
  const patch = labels.includes("patch") || labels.includes("Patch");
  if (patch) {
    return "patch";
  }
}

function getLabelNamesFromPullRequest(event) {
  // Get the names of the labels which were added to the pull request
  const labels = event.pull_request.labels.map(label => {
    return label.name;
  });

  return labels;
}

async function getLatestTagOnCurrentBranch() {
  const { stdout: tags } = await exec(
    "git describe --abbrev=0 --tags || echo 0"
  );
  const tag = tags.split("\n")[0];
  return tag;
}

async function createNewTag(tag) {
  await exec(`git tag v${tag}`);
  return;
}

async function pushTags() {
  await exec(`git push --tags`);
}

async function main() {
  try {
    const labels = getLabelNamesFromPullRequest(event);

    const releaseType = highestReleaseType(labels);

    if (!releaseType) {
      console.log(
        "No version label set. Cancelling automated versioning action."
      );
      return;
    }

    const tag = await getLatestTagOnCurrentBranch();

    const latestVersion = semver.coerce(tag);

    const newVersion = latestVersion.inc(releaseType).version;

    await createNewTag(newVersion);

    await pushTags();

    console.log(`Published tag ${newVersion}`);
  } catch (error) {
    process.exitCode = 1;
    console.error(error);
  }
}

main();
