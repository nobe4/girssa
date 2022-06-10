const core = require("@actions/core");

const sources = require("./src/sources.js");
const issues = require("./src/issues.js");

async function run() {
  try {
    const noop = core.getInput("noop", { required: true });
    const sources_path = core.getInput("sources", { required: true });
    const token = core.getInput("token", { required: true });
    const full_repository = core.getInput("repository", { required: true });

    const [owner, repo] = full_repository.split("/");

    issues.setup(token, owner, repo);

    sources
      .read(sources_path)

      // Fetch the items from the sources
      .then(sources.process)

      // Flatten the lists of item lists.
      .then((items) => [].concat(...items))

      // Filter the new items to put in issues.
      .then(issues.select)

      // Create the new issues.
      .then((items) => {
        if (noop) {
          core.notice("Noop'ing the issues creation");
          return items.map(
            (item) =>
              `[NOOP] Created issue for: '${item.full_title}'\n${item.html_url}`
          );
        } else {
          return issues.create(items);
        }
      })

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
