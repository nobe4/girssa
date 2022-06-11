```
  _____  _____  _____    _____  _____
 / ____||_   _||  __ \  / ____|/ ____|   /\
| |  __   | |  | |__) || (___ | (___    /  \
| | |_ |  | |  |  _  /  \___ \ \___ \  / /\ \
| |__| | _| |_ | | \ \  ____) |____) |/ ____ \
 \_____||_____||_|  \_\|_____/|_____//_/    \_\

 Github        RSS                   Action

```

:warning: Still under development, here be dragons :dragon:

> TODO do an intro

## Usage

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

See [`action.yml`](./action.yml) for options.

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
