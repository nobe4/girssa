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

      // Bypass if there's no items
      if (!items || items.length == 0) {
        resolve([]);
        return;
      }

      self
        .list()

        // If the issue has no body, it's never a match.
        .then((issues) =>
          issues.filter((issue) => issue.body && issue.body.length != 0)
        )

        .then((issues) => {
          // No issues mean we allow all items;
          if (issues.length == 0) return items;

          // Filtering happens here, we're removing all the items that already
          // have their ID in any issue body.
          return items.filter((item) => {
            return !issues.some((issue) => issue.body.includes(item.id));
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

    const body = [
      `<!-- ${item.id} -->`,
      `| [${item.source.name}](${item.source.url}) | [original](${item.link}) | ${formatted_published} |`,
      `| --- | --- | --- |`,
      ``,
      `${item.content}`,
    ].join("\n");

    return body;
  },

  // create creates a new issue for the rss item.
  //
  // @param {object} item - Item to create the issue with.
  //                        See rss.parse_item for format.
  //
  // @return {Promise} - Resolve with the list of fetched issues.
  //                     Reject with any error that occured.
  create_one(item) {
    return new Promise((resolve) => {
      const issue_data = {
        owner: github.owner,
        repo: github.repo,
        title: item.title,
        body: self.format_body(item),
        labels: [item.source.name],
      };

      // Bypass if noop is set
      if (github.noop) {
        const message = `[NOOP] Created issue for: '${
          item.title
        }'\n${JSON.stringify(issue_data)}`;
        core.notice(message);
        resolve(message);
        return;
      }

      github.client.rest.issues

        // https://docs.github.com/en/rest/issues/issues#create-an-issue
        .create(issue_data)

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

  // create selects and creates new issues for all the selected items.
  // It calls self.select before creating the items, as to only create needed
  // ones.
  //
  // @param {array} items - List of items to create issues for.
  //
  // @return {Promise} - Resolve when all the mapped sources' promises have resolved.
  //                     Reject with any error that occured.
  create(items) {
    return new Promise(function (resolve, reject) {
      self
        .select(items)

        .then((items) => Promise.allSettled(items.map(self.create_one)))

        // Return only the values, all the results should be fulfilled.
        .then((results) => results.map((result) => result.value))

        .then(resolve)
        .catch(reject);
    });
  },
};

module.exports = self;
