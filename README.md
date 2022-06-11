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
uses: nobe4/girssa@latest
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

> TODO

Users shouldn't consume the action from master since that would be latest code and actions can break compatibility between major versions.

Checkin to the v1 release branch

```bash
git checkout -b v1
git commit -a -m "v1 release"
git push origin v1
```

Your action is now published! :rocket:

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)
