'use strict';

const fs = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const core = require('@actions/core');
const github = require('@actions/github');
const { releaseTypeFromLabels, incrementTag } = require('./lib');

function getLabelNamesFromPullRequest(payload) {
  const labels = payload.pull_request.labels.map(label => {
    return label.name;
  });

  return labels;
}

async function getLatestTagOnCurrentBranch() {
  const { stdout: tags } = await exec(
    'git describe --abbrev=0 --tags || echo 0'
  );
  const tag = tags.split('\n')[0];
  return tag;
}

async function createNewTag(tag) {
  await exec(`git tag ${tag}`);
  return;
}

async function pushTags() {
  await exec('git push --tags');
}

async function main() {
  let payload;
  let octokit;
  let owner;
  let repo;

  try {
    // Get the JSON webhook payload for the event that triggered the workflow
    payload = JSON.parse(
      fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf-8')
    );
    owner = payload.repository.owner.login;
    repo = payload.repository.name;
    // Create an authenticated Github instance.
    octokit = new github.GitHub(core.getInput('github-token'));
    // Increment the last tag based on release labels if found.
    const labels = getLabelNamesFromPullRequest(payload);
    console.log(`Found labels: "${labels.join('", "')}".`);
    const releaseType = releaseTypeFromLabels(labels);
    if (!releaseType) {
      console.log(
        'No version label set. Cancelling automated versioning action.'
      );
      return;
    }
    console.log(`Calculating the version for a "${releaseType}" release.`);
    const latestTag = await getLatestTagOnCurrentBranch();
    console.log(`Found "${latestTag}" as the latest release.`);
    const newTag = incrementTag(latestTag, releaseType);

    // Output new tag as `VERSION`.
    console.log(`The next version is "${newTag}".`);
    core.setOutput('VERSION', newTag);

    // Return if the 'output only' option is set, without
    // actually making a new tag/release.
    const outputOnly = process.env.INPUT_OUTPUT_ONLY;
    if (outputOnly) {
      return;
    }

    // Create a release
    await createNewTag(newTag);
    await pushTags();
    const releaseTitle = `${releaseType}: ${payload.pull_request.title}`;
    await octokit.repos.createRelease({
      owner,
      repo,
      tag_name: newTag,
      name: releaseTitle
    });
    // Report actions
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: payload.pull_request.number,
      body: `:tada: This PR is included in version ${newTag} :tada:`
    });
    console.log(`Published tag ${newTag}`);
  } catch (error) {
    process.exitCode = 1;
    console.error(error);
    try {
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: payload.pull_request.number,
        body: `We tried to version this automatically but we failed. Please view the errors at https://github.com/${process.env.GITHUB_REPOSITORY}/runs/${process.env.GITHUB_RUN_ID}?check_suite_focus=true`
      });
    } catch (e) {
      console.error(error);
    }
  }
}

main();
