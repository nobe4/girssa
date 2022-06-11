```
  _____  _____  _____    _____  _____
 / ____||_   _||  __ \  / ____|/ ____|   /\
| |  __   | |  | |__) || (___ | (___    /  \
| | |_ |  | |  |  _  /  \___ \ \___ \  / /\ \
| |__| | _| |_ | | \ \  ____) |____) |/ ____ \
 \_____||_____||_|  \_\|_____/|_____//_/    \_\

 GitHub        RSS                   Action

```

:warning: Still under development, here be dragons :dragon:

[![check dist](https://github.com/nobe4/girssa/actions/workflows/check-dist.yml/badge.svg)](https://github.com/nobe4/girssa/actions/workflows/check-dist.yml)
[![codeql](https://github.com/nobe4/girssa/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/nobe4/girssa/actions/workflows/codeql-analysis.yml)
[![units-test](https://github.com/nobe4/girssa/actions/workflows/test.yml/badge.svg)](https://github.com/nobe4/girssa/actions/workflows/test.yml)

# Girssa

Girssa is a minimalist and easy to use RSS reader.
It leverages GitHub in many way to create a very simple RSS reader.

To use it: write a [_sources_](./sources.example.json) file and install the action in a repository.

That's it :sparkles:

Your new RSS items will be sent to the issues of the repository. You can then consult them freely.

## Usage and configuration

Girssa is meant to be run on an automated basis.

```yaml
name: build rss feed

on:
  workflow_dispatch:
  schedule:
    # Every day at midnight UTC
    - cron: "0 0 * * *"

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: nobe4/girssa@<TODO current version>
```

See [`action.yml`](./action.yml) for the action configuration.

:warning: GitHub actions might not be free for you. Make sure to check [the billing doc](https://docs.github.com/en/actions/learn-github-actions/usage-limits-billing-and-administration) to not have any bad surprise :money-with-wings:.

## Local setup

```shell
npm install
npm run test
npm run link
npm run fix
```

## Build

GitHub Actions will run the entry point from the [`action.yml`](./action.yml). Packaging assembles the code into one file that can be checked in to Git, enabling fast and reliable execution and preventing the need to check in `node_modules`.

Actions are run from GitHub repos. Packaging the action will create a packaged action in the [`dist`](./dist) folder.

```shell
npm run build
```

**Notes**:

- We recommend using the `--license` option for ncc, which will create a license file for all of the production node modules used in your project.
- `NODE_OPTIONS=--no-experimental-fetch` is needed to minify. See https://github.com/parcel-bundler/parcel/issues/8005#issuecomment-1120149358

## Release

Use the [`release.sh`](./scripts/release.sh) to create a new tag and open a new draft release.

See the file for configuration.

```shell
./scripts/release.sh
```
