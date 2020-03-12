const github = require("@actions/github");
const semver = require("semver");

const { promisify } = require("util");


const exec = promisify(require("child_process").exec);

function highestReleaseType(labels) {
  // Possible release types
  // 'major' | 'premajor' | 'minor' | 'preminor' | 'patch' | 'prepatch' | 'prerelease'
  const major = labels.includes("major");
  if (major) {
    return 'major';
  }
  const minor = labels.includes("minor");
  if (minor) {
    return 'minor';
  }
  const patch = labels.includes("patch");
  if (patch) {
    return 'patch';
  }
}
async function main() {
  try {
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = github.context.payload;

    // Get the names of the labels which were added to the pull request
    const labels = payload.pull_request.labels.map(label => {
      return label.name;
    });

    if (!labels) {
      console.log(
        "No version label set. Cancelling automated versioning action."
      );
      return;
    }

    const releaseType = highestReleaseType(labels);

    if (!releaseType) {
      console.log(
        "No version label set. Cancelling automated versioning action."
      );
      return;
    }

    // get previous tag
    const { stdout: tags } = await exec(
      "git describe --tags `git rev-list --tags --max-count=1` || echo 0"
    );
    const version = semver.coerce(tags.split("\n")[0]);
    
    version.inc(releaseType);

    await exec(
      `git tag v${version.version}`
    );

    await exec(
      `git push --tags`
    );

    console.log(`Published tag ${version.version}`);
  } catch (error) {
    process.exitCode = 1;
    console.error(error);
  }
}

main();
