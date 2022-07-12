// Handle fetching & parsing the RSS feeds.

const core = require("@actions/core");
const https = require("https");
const { XMLParser } = require("fast-xml-parser");

// Main rss object, all methods can be accessed via self.<method_name>.
const self = {
  // Custom HTTP Get options
  get_options: {
    headers: {
      // Some websites require a user-agent set.
      // E.g. Cloudfront
      "User-Agent": "javascript",
    },
  },

  // fetch does an HTTP GET request to the provided URL to fetch the RSS feed.
  // The URL is expected to be correct.
  //
  // @param {string} url - The Feed URL to fetch.
  //
  // @return {Promise} - Resolve with the response's body.
  //                     Reject with any error that occured.
  fetch(url) {
    return new Promise((resolve, reject) => {
      core.debug(`Fetching ${url}`);

      const req = https.get(url, self.get_options, (res) => {
        // We're only expecting a 200, tho any 2XX would work.
        if (res.statusCode !== 200) {
          return reject(`Request Failed. Status Code: ${res.statusCode}.`);
        }

        // Parse the body
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (body += c));

        res.on("end", () => {
          resolve(body);
        });
      });

      req.on("error", (e) => {
        core.warning("rss.fetch error");
        core.warning(e);
        reject(e);
      });

      // This is what actually sends the request.
      req.end();
    });
  },

  // parse_content tries to get the content from the item.
  // Since we're parsing RSS and ATOM, it can be in a number of places.
  // Also merge `description` and `content`.
  //
  // @param {object} item - The item to extract the content from.
  //
  // @return {string} - The content to use.
  parse_content(item) {
    if (item.description) return item.description;
    if (item.summary) return item.summary;
    if (item.content) return item.content;
    if (item["media:group"] && item["media:group"]["media:description"])
      return item["media:group"]["media:description"];
  },

  // parse_published tries to get the published date from the item.
  // Since we're parsing RSS and ATOM, it can be in a number of places.
  // It defaults to the current date and return a parsed date.
  //
  // @param {object} item - The item to extract the published date from.
  //
  // @return {date} - The published date to use.
  parse_published(item) {
    if (item.pubDate) return Date.parse(item.pubDate);
    if (item.created) return Date.parse(item.created);
    return Date.now();
  },

  // parse_link tries to get the link date from the item.
  //
  // @param {object} item - The item to extract the link from.
  //
  // @return {date} - The link to use.
  parse_link(item) {
    if (item.link && item.link != "") return item.link;

    // Youtube doesn't pass the link directly, but the video id
    if (item["yt:videoId"]) {
      return `https://www.youtube.com/watch?v=${item["yt:videoId"]}`;
    }
  },

  // parse_item extract a number of information from the item.
  // It makes RSS/ATOM into a single type of object.
  //
  // @param {object} item - The item to extract the content from.
  // @param {object} source - The source this item is coming from.
  //
  // @return {object} The parsed item.
  // Format:
  //        {
  //          source: {
  //            name: '<NAME>',
  //            url: '<URL>',
  //            rss_url: '<URL>',
  //          },
  //          id: '<ID>',
  //          link: '<LINK>',
  //          title: '<TITLE>',
  //          content: '<CONTENT>',
  //          published: <TIMESTAMP>
  //        }
  parse_item(item, source) {
    return {
      source: source,
      id: item.guid || item.id,
      title: item.title,
      content: self.parse_content(item),
      link: self.parse_link(item),
      published: self.parse_published(item),
    };
  },

  // parse uses an XML string to extract information about feed items.
  // It handles RSS AND ATOM feeds
  // ref: https://en.wikipedia.org/wiki/RSS#RSS_compared_with_Atom
  //
  // @param {string} data - The string data containing the feed in XML.
  // @param {object} source - The source this data is coming from.
  //
  // @return {Promise} - Resolve with the parsed items.
  //                     Reject with any error that occured.
  parse(data, source) {
    return new Promise((resolve, reject) => {
      const parser = new XMLParser();
      const result = parser.parse(data);

      // Get the channel
      // - `rss.channel` for RSS feeds
      // - `feed` for Atom feeds
      let channel =
        result.rss && result.rss.channel ? result.rss.channel : result.feed;

      // If channel is undefined, it means data wasn't XML, reject.
      if (channel == undefined) {
        reject(`invalid XML for '${source.name}' '${source.rss_url}'\n${data}`);
        return;
      }

      // Select the first channel only.
      if (Array.isArray(channel)) channel = channel[0];

      // RSS items are in `item`, Atom items are in `entry`.
      let items = channel.item || channel.entry;

      // Ensure we have an array of items.
      if (items && !Array.isArray(items)) items = [items];

      // If there is no item, it can be OK, but it's better to warn.
      if (!items || items.length == 0) {
        core.warning(`No items found for '${source.name}'.`);
        resolve([]);
      }

      // Parse each items
      const parsed_items = items.map((item) => {
        return self.parse_item(item, source);
      });

      resolve(parsed_items);
    });
  },

  // get is the entrypoint to get the RSS items.
  //
  // @param {object} source - The source to get the items from.
  //
  // @return {Promise} - Resolve with the parsed items.
  //                     Reject with any error that occured.
  get(source) {
    return new Promise((resolve, reject) => {
      self
        .fetch(source.rss_url)
        .then((data) => self.parse(data, source))
        .then(resolve)
        .catch((e) => {
          reject({
            error: e,
            source: source,
          });
        });
    });
  },
};

module.exports = self;
