// Handle interactions with github issues

const core = require("@actions/core");
const github = require("./github.js");

const self = {
  // list lists all the issues in the repository.
  //
  // @return {Promise} - Resolve with the list of fetched issues.
  //                     Reject with any error that occured.
  list() {
    return new Promise((resolve, reject) => {
      // Bypass if noop is set
      if (github.noop) {
        core.notice(
          `[NOOP] List all the issues in ${github.owner}/${github.repo}`
        );
        resolve([]);
        return;
      }

      core.debug(`List all the issues in ${github.owner}/${github.repo}`);

      github.client.rest.issues

        .listForRepo({
          owner: github.owner,
          repo: github.repo,
          state: "all",
        })

        .then(({ data }) => resolve(data))

        .catch((e) => {
          core.warning("issues.list error");
          core.warning(e);
          reject(e);
        });
    });
  },

  // select filter in all the items that needs to be created
  //
  // @param {array} items - List of items to be filtered.
  //                        The issues will be fetched via self.list().
  //
  // @return {array} - List of items that needs to be added in issues.
  select(items) {
    return new Promise((resolve, reject) => {
      core.debug("Filtering the items");

      self
        .list()

        .then((issues) => {
          // Filtering happens here, we're removing all the items that already
          // have their ID in any issue body.
          return items.filter((item) => {
            core.debug("Filtering item");
            core.debug(item.title);

            return !issues.some((issue) => {
              core.debug("Comparing against issue");
              core.debug(issue);
              return issue.body.includes(item.id);
            });
          });
        })

        .then(resolve)
        .catch(reject);
    });
  },

  // format_body create a string to represent the issue body.
  //
  // @param {object} item - Item to create the issue with.
  //                        See create_one for format.
  //
  // @return {string} - Formatted body
  format_body(item) {
    const formatted_published = new Date(item.published).toLocaleString(
      "en-GB",
      { timeZone: "UTC" }
    );

    const body = `
    | source (link) TODO | [original](${item.link}) | ${formatted_published} | ${item.id} |
    | --- | --- | --- | --- |

    ${item.content}

    `.replace(/(\s{2})+/g, "");

    return body;
  },

  // create creates a new issue for the rss item.
  //
  // @param {object} item - Item to create the issue with.
  //        {
  //          id: '<ID>',
  //          link: '<LINK>',
  //          title: '<TITLE>',
  //          content: '<CONTENT>',
  //          published: <TIMESTAMP>
  //        }
  //
  // @return {Promise} - Resolve with the list of fetched issues.
  //                     Reject with any error that occured.
  create_one(item) {
    return new Promise((resolve) => {
      // Bypass if noop is set
      if (github.noop) {
        const message = `[NOOP] Created issue for: '${item.title}'`;
        core.notice(message);
        resolve(message);
        return;
      }

      github.client.rest.issues

        .create({
          owner: github.owner,
          repo: github.repo,
          title: item.title,
          body: self.format_body(item),
        })

        .then(({ data }) => {
          const message = `Created issue for: '${item.title}'\n${data.html_url}`;
          core.notice(message);
          resolve(message);
        })

        .catch(({ response }) => {
          const message = `Error creating issue for: '${item.title}'\n${response.status}: ${response.data.message}`;
          core.warning(message);

          // Resolve to aggregate all the messages in one place.
          resolve(message);
        });
    });
  },

  // create creates new issues for all the items
  //
  // @param {array} items - List of items to create issues for.
  //
  // @return {Promise} - Resolve when all the mapped sources' promises have resolved.
  //                     Reject with any error that occured.
  create(items) {
    return new Promise(function (resolve, reject) {
      Promise.allSettled(items.map(self.create_one))

        // Return only the values, all the results should be fulfilled.
        .then((results) => results.map((result) => result.value))

        .then(resolve)
        .catch(reject);
    });
  },
};

module.exports = self;
