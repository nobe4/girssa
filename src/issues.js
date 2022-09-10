// Handle interactions with github issues

const { setTimeout } = require("timers/promises");
const core = require("@actions/core");
const github = require("./github.js");

const self = {
  // list lists all the issues in the repository.
  // https://octokit.github.io/rest.js/v18#issues-list-for-repo
  // https://octokit.github.io/rest.js/v18#pagination
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

      github.client
        .paginate(github.client.rest.issues.listForRepo, {
          owner: github.owner,
          repo: github.repo,
          state: "all",
        })

        .then(resolve)

        .catch((e) => {
          core.warning("issues.list error");
          core.warning(e);
          reject(e);
        });
    });
  },

  // list_filtering_issues list all the issues relevant for filtering the items.
  // It calls issues.list() and applies some filtering
  //
  // @return {Promise} - Resolve with the list of selected issues to filter with.
  //                     Reject with any error that occured.
  list_filtering_issues() {
    return new Promise((resolve, reject) => {
      self
        .list()
        .then((issues) =>
          issues.filter(
            (issue) =>
              // Keep only issues with a body.
              issue.body &&
              issue.body.length != 0 &&
              // Keep issues that are not pull requests
              // Pull requests have an extra key for PR-related info
              issue.pull_request === undefined
          )
        )
        .then(resolve)
        .catch(reject);
    });
  },

  // select filter in all the items that needs to be created
  //
  // @param {array} items - List of items to be filtered.
  //                        The issues will be fetched via self.list().
  //
  // @return {Promise} - Resolve with the list of selected items.
  //                     Reject with any error that occured.
  select(items) {
    return new Promise((resolve, reject) => {
      core.debug("Filtering the items");

      // Bypass if there's no item.
      if (!items || items.length === 0) {
        resolve([]);
        return;
      }

      self
        .list_filtering_issues()

        .then((issues) => {
          // Bypass if there's no issue to filter with.
          if (!issues || issues.length === 0) {
            return items;
          }

          // Filtering happens here, we're removing all the items that already
          // have their ID in any issue body.
          return items.filter(
            (item) => !issues.some((issue) => issue.body.includes(item.id))
          );
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
      `${item.embed}`,
      `${item.content}`,
    ].join("\n");

    return body;
  },

  // create_one creates a new issue for the rss item.
  // https://octokit.github.io/rest.js/v18#issues-create
  //
  // Using a `delay` value to prevent hitting the HTTP Rate Limit.
  // https://docs.github.com/en/rest/guides/best-practices-for-integrators#dealing-with-secondary-rate-limits
  //
  // @param {object} item - Item to create the issue with.
  //                        See rss.parse_item for format.
  // @param {integer} delay - Delay to wait before running the command, in seconds.
  //                          See issues.create for details on how this is passed.
  //
  // @return {Promise} - Resolve with the list of fetched issues.
  //                     Reject with any error that occured.
  create_one(item, delay) {
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
        const message = `[NOOP] Created issue for: '${item.title}'`;
        core.notice(message);
        resolve(message);
        return;
      }

      core.debug(
        `Waiting ${delay} seconds before creating an issue for ${item.title}`
      );

      // setTimeout takes a delay in milliseconds.
      delay *= 1000;

      // setTimeout takes the value to pass upon resolution as 2nd argument.
      setTimeout(delay, issue_data)
        .then(github.client.rest.issues.create)

        .then(({ data }) => {
          const message = `${data.html_url} => ${item.title}`;
          core.notice(message);
          resolve(message);
        })

        .catch((e) => {
          const message = `Error creating issue for: '${item.title}'\n${e.stack}`;
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

        // There's some magic here that warrants a comment.
        // [].map will call the callback with the item and its index.
        // We can use the index as a "delay" value as to not hit the HTTP Rate limit.
        // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
        // See issues.create_one for details.
        .then((items) => Promise.allSettled(items.map(self.create_one)))

        // Return only the values, all the results should be fulfilled.
        .then((results) => results.map((result) => result.value))

        .then(resolve)
        .catch(reject);
    });
  },
};

module.exports = self;
