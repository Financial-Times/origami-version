const core = require("@actions/core");
const github = require("@actions/github");
const semver = require('semver');
const git = require('simple-git')();

const { promisify } = require('util')

const getTags = promisify(git.tags.bind(git))

async function main() {
  try {
    // `who-to-greet` input defined in action metadata file
    // const nameToGreet = core.getInput("who-to-greet");
    // console.log(`Hello ${nameToGreet}!`);
    // const time = new Date().toTimeString();
    // core.setOutput("time", time);

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = github.context.payload;
    console.log(`The event payload: ${JSON.stringify(github.context.payload, undefined, 2)}`);

    const labels = payload.pull_request.labels.map(label => {
      return label.name;
    });

    const major = labels.includes("major");
    const minor = labels.includes("minor");
    const patch = labels.includes("patch");

    // This should be a token with access to your repository scoped in as a secret.
    // The YML workflow will need to set myToken with the GitHub Secret Token
    // myToken: ${{ secrets.GITHUB_TOKEN }}
    // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
    // const myToken = core.getInput("myToken");

    // const octokit = new github.GitHub(myToken);

    // const { tags } = await octokit.repos.listTags({
    //   owner: payload.repository.owner.login,
    //   repo: payload.repository.name
    // });

    const tags = await getTags();
    const versions = tags.map(tag => {
      return semver.coerce(tag.name);
    }).filter(version => {
      return version != null;
    });

    versions.sort(semver.rcompare);

    console.log({labels, major, minor, patch, tags});
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
