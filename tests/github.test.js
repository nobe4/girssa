const action_github = require("@actions/github");
const github = require("../src/github.js");

describe("setup", () => {
  it("setup the client, owner and repo correctly", () => {
    jest.spyOn(action_github, "getOctokit").mockReturnValueOnce("client");

    github.setup("token", "owner", "repo", true);

    expect(github.client).toBe("client");
    expect(github.owner).toBe("owner");
    expect(github.repo).toBe("repo");
    expect(github.noop).toBeTruthy();
  });
});
