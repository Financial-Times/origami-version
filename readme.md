# origami-version

This action will create a semver git tag based on the semver label a pull-request has.

Labels used:
- major
- minor
- patch

If no label is on a pull-request, no tag will be created.


## How to use

This action requires three specific labels to exist on the GitHub repository:

- Major
- Minor
- Patch

This action also requires a checkout with all tags to have happened before.
The workflow below will do this all:

```yaml
on:
  pull_request:
    types: [closed] # Merged pull-requests count as closed pull-requests.

jobs:
  create-new-version:
    runs-on: ubuntu-latest
    name: Create new version/tag
    steps:
      - uses: actions/checkout@master
        if: github.event.pull_request.merged # Only run on merged pull-requests
        with:
          ref: ${{ github.event.pull_request.merge_commit_sha }} # Checkout the merged commit
          fetch-depth: 0
      - run: git fetch --depth=1 origin +refs/tags/*:refs/tags/* # Get all tags from the origin
      - uses: Financial-Times/origami-version@master
        name: Create new version/tag
        if: github.event.pull_request.merged  # Only run on merged pull-requests
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}

```