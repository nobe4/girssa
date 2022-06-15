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
[![coverage](https://github.com/nobe4/girssa/actions/workflows/coverage.yml/badge.svg)](https://github.com/nobe4/girssa/actions/workflows/coverage.yml)

# Girssa

Girssa is a minimalist and easy to use [RSS](https://en.wikipedia.org/wiki/RSS) reader.
It leverages GitHub in two ways: _actions_ for automation and _issues_ for storage.

To use it: write a [_sources_](./sources.example.json) file and install the action in a repository.

Done :sparkles:

Girssa sends the RSS items to the repository's issues. You can then consult them freely.

## How does it work?

0. The source file is read (`sources.read`).
1. For each source, the feed is fetched (`rss.fetch`) and parsed (`rss.parse`).
2. New items are selected (`issues.select`).
3. For each new item, an issues is created (`issues.create`).

## Usage and configuration

You can run Girssa on an automated basis.

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
      - uses: nobe4/girssa@<current version>
```

:warning: GitHub actions can cost you. Make sure to check [the billing doc](https://docs.github.com/en/actions/learn-github-actions/usage-limits-billing-and-administration) to not have any bad surprise :money_with_wings:.

### `sources.json`

The sources file expect an array of objects with at least the following keys:

- `name`: The name of the feed.
- `rss_url`: The RSS URL to fetch items from.

See [`sources.example.json`](./sources.example.json) for an example.

:information_source: Known limitation: You need to get the RSS URL yourself :grimacing:.
I'm planning on writing documentation on how to do this, maybe even automate this process in the future.
See https://github.com/nobe4/girssa/issues/28

### Configuration

You can configure Girssa with some options, see [`action.yml`](./action.yml) for details.

Example:

```yaml
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: nobe4/girssa@<current version>
        with:
          repository: <another/repository>
          token: <token with access to another/repository>
          noop: true
```

## Contributing

See [the contributing guide](./CONTRIBUTING.md)

## License

See [LICENSE](./LICENSE)
