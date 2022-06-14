// Entrypoint

const core = require("@actions/core");

const sources = require("./sources.js");
const issues = require("./issues.js");
const github = require("./github.js");

const self = {
  async main() {
    try {
      const noop = core.getInput("noop", { required: true }) === "true";
      const sources_path = core.getInput("sources", { required: true });
      const token = core.getInput("token", { required: true });

      const full_repository = core.getInput("repository", { required: true });
      const [owner, repo] = full_repository.split("/");

      core.notice(
        `Running with noop: ${noop}, sources: ${sources_path}, repo: ${owner}/${repo}`
      );

      await self.run(noop, sources_path, token, owner, repo).then(core.notice);
      // The catch below will catch this one as well
    } catch (e) {
      core.error(e);
      core.setFailed(e.message);
    }
  },

  run(noop, sources_path, token, owner, repo) {
    return new Promise((resolve, reject) => {
      github.setup(token, owner, repo, noop);

      sources
        .read(sources_path)

        // Fetch the items from the sources
        .then(sources.process)

        // Flatten the lists of item lists.
        .then((items) => [].concat(...items))

        // Filter the new items to put in issues.
        .then(issues.select)

        // Create the new issues.
        .then(issues.create)

        // Output the result and set the output count.
        .then((results) => {
          core.setOutput("count", results.length);
          return results.join("\n");
        })

        // Output based on status
        .then(resolve)
        .catch(reject);
    });
  },
};

module.exports = self;

// Ignore the script call, we'll be testing only the module exports.
// istanbul ignore next
if (require.main !== module) {
  self.main();
}
