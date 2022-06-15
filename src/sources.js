// Handle interactions with the sources file.

const core = require("@actions/core");
const rss = require("./rss.js");
const github = require("./github.js");

const self = {
  noop_sources: [
    {
      name: "fakesource",
      url: "example.com",
      rss_url:
        "https://raw.githubusercontent.com/nobe4/girssa/main/tests/fixtures/atom_feed.xml",
    },
  ],

  // read reads the source file from its path.
  //
  // @param {string} path - Path to the sources file.
  //
  // @return {Promise} - Resolves with the parsed content of the json file.
  //                     Rejects with any error that occured.
  read(path) {
    return new Promise((resolve, reject) => {
      // Bypass if noop is set
      if (github.noop) {
        core.notice(
          `[NOOP] Reading source file ${github.owner}/${github.repo}/${path}`
        );
        resolve(self.noop_sources);
        return;
      }

      core.debug(`Reading source file ${github.owner}/${github.repo}/${path}`);

      github.client.rest.repos
        .getContent({
          owner: github.owner,
          repo: github.repo,
          path: path,
        })

        // Extract content and parse JSON
        .then(({ data }) => {
          core.debug(`Received from API: ${JSON.stringify(data)}`);
          return data.content;
        })

        // Using atob fails in nodejs 16.X with [InvalidCharacterError]: Invalid character
        .then((encoded) => Buffer.from(encoded, "base64").toString("utf-8"))

        .then(JSON.parse)

        .then(resolve)

        .catch((e) => {
          core.warning("sources.read error");
          core.warning(e);
          reject(e);
        });
    });
  },

  // filter_results filter the Promise.allSettled result objects
  //
  // @param {array} results - Array of result objects.
  //                          { status: "fulfilled", value: ... }
  //                          { status: "rejected", reason: ... }
  //
  // @return {array} - Fulfilled results' value.
  filter_results(results) {
    return (
      results

        // Filter only the fullfilled results, log an error for the rejected.
        // This way, we don't stop the execution but fail with a log.
        .filter((result) => {
          if (result.status === "fulfilled") return true;

          core.warning("Error while processing:");
          core.warning(result.reason); // full details

          // Explicit return
          return false;
        })

        // Only return the value
        .map((result) => result.value)
    );
  },

  // fetch loop through the sources and fetch the items for each.
  //
  // @param {array} sources - List of sources to fetch.
  //
  // @return {Promise} - Resolves when all the mapped sources' promises have resolved.
  //                     Rejects with any error that occured.
  fetch(sources) {
    return new Promise((resolve, reject) => {
      Promise.allSettled(
        sources.map((source) => {
          core.debug(`Processing ${source.name}`);

          return rss.get(source);
        })
      )

        // allSettled always calls `.then`, we need to filter successes
        .then(self.filter_results)

        .then(resolve)

        .catch((e) => {
          core.warning("sources.fetch error");
          core.warning(e);
          reject(e);
        });
    });
  },

  // get gets all the items sources and fetch them.
  // It's a wrapper around self.read and self.fetch.
  //
  // @param {string} path - Path to the sources file.
  //
  // @return {Promise} - Resolves with the fetched items.
  //                     Rejects with any error that occured.
  get(path) {
    return new Promise((resolve, reject) => {
      self
        .read(path)

        // Fetch the items from the sources
        .then(self.fetch)

        // Flatten the lists of item lists.
        .then((items) => [].concat(...items))

        .then(resolve)
        .catch(reject);
    });
  },
};

module.exports = self;
