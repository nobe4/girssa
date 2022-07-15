# Sources

The sources are configured with a JSON file, whose name [defaults to `sources.json`](../action.yml).

It expects an array of objects with at least the following keys:

- `name`: The name of the feed.
- `url`: The original URL of the feed.
- `rss_url`: The RSS URL to fetch items from.

See [`sources.example.json`](./sources.example.json) for an example.

# Getting the `rss_url`

:information_source: You currently need to do this yourself.

It might be automated at some point.

See https://github.com/nobe4/girssa/issues/28

## Using [RSSBox](https://rssbox.herokuapp.com/)

## Youtube

1. Go to the channel's page, i.e. [GitHub](https://www.youtube.com/c/GitHub).
2. Run the following script from the console.

```
`https://www.youtube.com/feeds/videos.xml?channel_id=${ytInitialData.metadata.channelMetadataRenderer.externalId}`
```

_Note: this data is present in the HTTP request, i.e. using `curl https://www.youtube.com/c/GitHub`, it is possible to automate it._

## Twitter

Use `https://nitter.net/<account>/rss`

E.g.
`https://twitter.com/github` => `https://nitter.net/github/rss`

:information_source: `nitter.net` doesn't have perfect reliability and fetching might fail.
Retrying is usually the easiest fix.

A better way is be to loop through the [instance list](https://github.com/zedeus/nitter/wiki/Instances).

## Other?

> Open for contributions!
