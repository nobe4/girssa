# Contributing

Hi :wave: thanks for stopping by.

We release contributions to this under the [project's open source license](LICENSE.md).

## Tracking work

We're currently tracking issues/ideas in [issues](issues).

## Submitting a pull request

0. [Fork](fork) and clone the repository.
1. Follow the local development setup.
2. Make sure the tests pass on your machine: `npm test`.
3. Create a new branch: `git checkout -b my-branch-name`.
4. Make your change, add tests, and make sure the tests still pass.
5. Push to your fork and [submit a pull request](pr).
6. Wait for your pull request to be reviewed and merged.

## Local setup

You should run Nodejs 16 to match the action's version.

Using [`nodeenv`](https://github.com/nodenv/nodenv) is recommended.

```shell
nodenv install
npm install
```

## Development

Write code, tests and verify that everything is correctly running with:

```
npm run test
npm run lint
npm run fix
```

See [package.json](./package.json) for details.

## Build

GitHub Actions runs the entry point from the [`action.yml`](./action.yml). Packaging assembles the code into a single file. We will add the file in to Git for fast and reliable execution. It also prevents the need to check in `node_modules`.

Actions are run from GitHub repositories. Packaging the action will create a packaged action in the [`dist`](./dist) folder.

```shell
npm run build
```

:information_source: `NODE_OPTIONS=--no-experimental-fetch` is needed to minify. See https://github.com/parcel-bundler/parcel/issues/8005#issuecomment-1120149358

## Release

:information_source: Only contributors with write-access will be able to do this step.

Use the [`release.sh`](./scripts/release.sh) to create a new tag and open a new draft release.

See the file for configuration.

```shell
./scripts/release.sh
```
