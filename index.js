"use strict";

const fs = require("fs");
const semver = require("semver");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const core = require('@actions/core');
const github = require("@actions/github");

function highestReleaseType(labels = []) {
  // Possible release types
  // 'major' | 'premajor' | 'minor' | 'preminor' | 'patch' | 'prepatch' | 'prerelease'
  const major = labels.includes("release:major");
  if (major) {
    return "major";
  }
  const minor = labels.includes("release:minor");
  if (minor) {
    return "minor";
  }
  const patch = labels.includes("release:patch");
  if (patch) {
    return "patch";
  }
}

function getLabelNamesFromPullRequest(payload) {
  const labels = payload.pull_request.labels.map(label => {
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
  await exec(`git tag ${tag}`);
  return;
}

async function pushTags() {
  await exec(`git push --tags`);
}

async function main() {
  try {
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.parse(
      fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf-8" )
    );

    const octokit = new github.GitHub(core.getInput('github-token'));

    const labels = getLabelNamesFromPullRequest(payload);

    const releaseType = highestReleaseType(labels);

    if (!releaseType) {
      console.log(
        "No version label set. Cancelling automated versioning action."
      );
      return;
    }

    const tag = await getLatestTagOnCurrentBranch();

    const latestVersion = semver.coerce(tag);

    const tag_name = 'v' + latestVersion.inc(releaseType).version;

    await createNewTag(tag_name);

    await pushTags();

    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const releaseTitle = `${releaseType}: ${payload.pull_request.title}`;

    await octokit.repos.createRelease({
      owner,
      repo,
      tag_name,
      name: releaseTitle
    });

    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: payload.pull_request.number,
      body: `:tada: This PR is included in version ${tag_name} :tada:`
    });

    console.log(`Published tag ${tag_name}`);
  } catch (error) {
    process.exitCode = 1;
    console.error(error);
    try {
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: payload.pull_request.number,
        body: `We tried to version this automatically but we failed. Please view the errors at https://github.com/${process.env.GITHUB_REPOSITORY}/runs/${GITHUB_RUN_ID}?check_suite_focus=true`
      });
    } catch (e) {
      console.error(error);
    }
  }
}

main();
