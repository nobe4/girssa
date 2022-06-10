// Handle interactions with the sources file.

const core = require("@actions/core");
const fs = require("fs");
const rss = require("./rss.js");

const self = {
  // read reads the source file from its path.
  //
  // @param {string} path - Path to the sources file.
  //
  // @return {object} - Parsed content of the json file.
  read(path) {
    return new Promise(function (resolve, reject) {
      core.debug(`Reading source file ${path}`);

      fs.readFile(path, "utf8", (err, content) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          resolve(JSON.parse(content));
        } catch (e) {
          reject(e);
        }
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

  // process loop through the sources and fetch the items for each.
  //
  // @param {array} sources - List of sources to process.
  //
  // @return {Promise} - Resolve when all the mapped sources' promises have resolved.
  //                     Reject with any error that occured.
  process(sources) {
    return new Promise(function (resolve, reject) {
      Promise.allSettled(
        sources.map((source) => {
          core.debug(`Processing ${source.name}`);

          return rss.get(source.rss_url);
        })
      )

        // allSettled always calls `.then`, we need to filter successes
        .then(self.filter_results)

        .then(resolve)
        .catch(reject);
    });
  },
};

module.exports = self;
