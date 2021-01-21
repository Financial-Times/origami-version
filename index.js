'use strict';

const fs = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const core = require('@actions/core');
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

async function main() {
  let payload;

  try {
    // Get the JSON webhook payload for the event that triggered the workflow
    payload = JSON.parse(
      fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf-8')
    );
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

  } catch (error) {
    process.exitCode = 1;
    console.error(error);
  }
}

main();
