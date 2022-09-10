// Handle fetching the RSS feeds.

const core = require("@actions/core");
const https = require("https");
const parser = require("./parser.js");

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
        .then((data) => parser.parse(data, source))
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
