# Origami Version

GitHub action to calculate the version to release based on the release labels a pull-request has.

The labels this actions uses are:
- `release:major`
- `release:minor`
- `release:patch`
- `release:beta`

Where `release:beta` may be used alone or in conjunction with any of the other 3 release labels.

## Usage

To use this action create a job that runs on closed pull requests. Ensure the closed pull request was merged as part of the job. The action outputs `VERSION` which may be used in other steps of your job.

```yml
name: Origami Version Example
on:
  pull_request:
    types: [closed] # Merged pull-requests count as closed pull-requests.
jobs:
  output-next-version:
    name: Output the version which should be released
    runs-on: ubuntu-latest
    if: github.event.pull_request.merged # Only run on merged pull-requests
    steps:
      - name: Set up node
        uses: actions/setup-node@v2.1.4
        with:
          node-version: '15.x'
          registry-url: 'https://registry.npmjs.org'

      - name: Checkout the project repository
        uses: actions/checkout@v2
        with:
          ref: ${{ github.event.pull_request.merge_commit_sha }} # Checkout the merged commit
          fetch-depth: 0

      - name: Find the next version of the project to release
        uses: Financial-Times/origami-version@v1
        with:
          output-only: true
          github-token: ${{ secrets.ORIGAMI_GITHUB_TOKEN }}

      - name: Error if the next version wasn't found
        if: secrets.ORIGAMI_GITHUB_TOKEN == null
        run: exit 1

      - name: Output Version Found
        run: echo "Version '${{ steps.version.outputs.VERSION }}'" # You could publish to npm here instead, for example
```

## Outputs

- `VERSION`: the semver version to release based on any added Github release labels, or `null` if no release labels were added.
