// Handle interactions with Github API

const github = require("@actions/github");

const self = {
  client: undefined,
  owner: undefined,
  repo: undefined,
  noop: false,

  setup(token, owner, repo, noop) {
    self.client = github.getOctokit(token);
    self.owner = owner;
    self.repo = repo;
    self.noop = noop;
  },
};

module.exports = self;
