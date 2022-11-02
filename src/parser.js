// Handle parsing the RSS feed.

const core = require("@actions/core");
const { XMLParser } = require("fast-xml-parser");

const self = {
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
      id: self.parse_id(item),
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
      const options = {
        ignoreAttributes: false,
      };
      const parser = new XMLParser(options);
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

  // parse_link tries to get the link from the item.
  //
  // @param {object} item - The item to extract the link from.
  //
  // @return {string} - The link to use.
  parse_link(item) {
    if (item.link) {
      if (typeof item.link == "string" && item.link != "") return item.link;

      if (typeof item.link == "object") {
        // Single item
        if (
          typeof item.link["@_href"] == "string" &&
          item.link["@_href"] != ""
        ) {
          return item.link["@_href"];
        }

        // Multiple items, need to find the alternate link
        for (let i = 0; i < item.link.length; i++) {
          if (item.link[i]["@_rel"] == "alternate") {
            return item.link[i]["@_href"];
          }
        }
      }
    }
  },

  // parse_id tries to get the id from the item.
  //
  // @param {object} item - The item to extract the id from.
  //
  // @return {string} - The id to use.
  parse_id(item) {
    if (item.id) {
      if (typeof item.id == "string") return item.id;
      if (typeof item.id == "object" && item.id["#text"] != "") {
        return item.id["#text"];
      }
    }

    if (item.guid) {
      if (typeof item.guid == "string") return item.guid;
      if (typeof item.guid == "object" && item.guid["#text"] != "") {
        return item.guid["#text"];
      }
    }
  },
};

module.exports = self;
