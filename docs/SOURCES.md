# Sources

The sources are configured with a JSON file, whose name [defaults to `sources.json`](../action.yaml).

It expects an array of objects with at least the following keys:

- `name`: The name of the feed.
- `url`: The original URL of the feed.
- `rss_url`: The RSS URL to fetch items from.

See [`sources.example.json`](./sources.example.json) for an example.

# Getting the `rss_url`

:information_source: You currently need to do this yourself.

It will be automated at some point.

See https://github.com/nobe4/girssa/issues/28

## Youtube

> TODO
https://webapps.stackexchange.com/a/116549

## Twitter

Use `https://nitter.net/<account>/rss`

E.g.
  `https://twitter.com/github` => `https://nitter.net/github/rss`

:information_source: `nitter.net` doesn't have perfect reliability, so fetching migh fail.
Retrying is usually the easiest fix.

A better way might be to loop through the [instance list](https://github.com/zedeus/nitter/wiki/Instances).
