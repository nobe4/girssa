const core = require("@actions/core");

const sources = require("./src/sources.js");
const issues = require("./src/issues.js");
const github = require("./src/github.js");

async function run() {
  try {
    const noop = core.getInput("noop", { required: true });
    const sources_path = core.getInput("sources", { required: true });
    const token = core.getInput("token", { required: true });
    const full_repository = core.getInput("repository", { required: true });

    core.notice(`Running with noop: ${noop}, sources: ${sources_path}, repo: ${full_repository}")

    const [owner, repo] = full_repository.split("/");

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
      .then(core.notice)
      .catch(core.error);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
