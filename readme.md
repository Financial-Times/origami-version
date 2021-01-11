
# Origami Version

GitHub action to create a semver git tag and release based on the semver label a pull-request has.


## Usage

To use this action, create the following file in your GitHub repo:

```
.github/workflows/automatic-tag-and-release.yml
```

```yml
on:
  pull_request:
    types: [closed] # Merged pull-requests count as closed pull-requests.

jobs:
  create-new-version:
    runs-on: ubuntu-latest
    name: Create new version/tag
    steps:
      - uses: actions/checkout@f90c7b395dac7c5a277c1a6d93d5057c1cddb74e
        if: github.event.pull_request.merged # Only run on merged pull-requests
        with:
          ref: ${{ github.event.pull_request.merge_commit_sha }} # Checkout the merged commit
          fetch-depth: 0
      - run: git fetch --depth=1 origin +refs/tags/*:refs/tags/* # Get all tags from the origin
      - uses: Financial-Times/origami-version@v1.1.0
        name: Create new version/tag
        if: github.event.pull_request.merged  # Only run on merged pull-requests
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

You can do this by running the following command from a repo:

```bash
mkdir -p .github/workflows && curl https://raw.githubusercontent.com/Financial-Times/origami-labels/v1.0.0/example.yml --output .github/workflows/automatic-tag-and-release.yml
```


## Labels

The labels this actions uses are:

- release:major
- release:minor
- release:patch

## Development

Work should be based on the `master` branch, with changes PRed in.

If your changes are not breaking, merge them into the `v1` branch, and they'll be picked up by every repo running `v1` automatically.

If your changes ARE breaking, then you should create a `v2` branch based on master and update your chosen repo to use the new workflow.
