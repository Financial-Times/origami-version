const github = require("@actions/github");
const semver = require("semver");

const { promisify } = require("util");


const exec = promisify(require("child_process").exec);

async function main() {
  try {
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = github.context.payload;

    const labels = payload.pull_request.labels.map(label => {
      return label.name;
    });

    if (!labels) {
      console.log(
        "no version label set. Cancelling automated versioning action."
      );
      return;
    }

    const major = labels.includes("major");
    const minor = labels.includes("minor");
    const patch = labels.includes("patch");

    if (!major && !minor && !patch) {
      console.log(
        "no version label set. Cancelling automated versioning action."
      );
      return;
    }

    // get previous tag
    const { stdout: tags } = await exec(
      "git describe --tags `git rev-list --tags --max-count=1`"
    );
    const version = semver.coerce(tags.split("\n")[0]);

    if (major) {
      // 'major' | 'premajor' | 'minor' | 'preminor' | 'patch' | 'prepatch' | 'prerelease'
      version.inc("major");
    } else if (minor) {
      version.inc("minor");
    } else if (patch) {
      version.inc("patch");
    }

    await exec(
      `git tag v${version.version}`
    );

    await exec(
      `git push --tags`
    );

    console.log(`published tag ${version.version}`);
  } catch (error) {
    process.exitCode = 1;
    console.error(error);
  }
}

main();
