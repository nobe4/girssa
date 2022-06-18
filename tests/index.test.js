const core = require("@actions/core");
jest.mock("@actions/core");

const sources = require("../src/sources.js");
const issues = require("../src/issues.js");
const github = require("../src/github.js");
const index = require("../src/index.js");

describe("main", () => {
  it("fetchs, parses and uses the input correctly", async () => {
    // Key is value, except for repository.
    core.getInput.mockImplementation((key) =>
      key == "repository" ? "owner/repo" : key
    );

    const index_run_spy = jest.spyOn(index, "run");
    index_run_spy.mockResolvedValueOnce("OK");

    await index.main();

    expect(index_run_spy).toHaveBeenCalledWith(
      false,
      "sources",
      "token",
      "owner",
      "repo"
    );
    expect(core.notice).toHaveBeenCalledWith(
      "Running with noop: false, sources: sources, repo: owner/repo"
    );
    expect(core.notice).toHaveBeenCalledWith("OK");
  });

  it("parses noop correctly", async () => {
    core.getInput.mockImplementation((key) =>
      // Key is value, except for noop and repository.
      key === "noop" ? "true" : key === "repository" ? "owner/repo" : key
    );

    const index_run_spy = jest.spyOn(index, "run");
    index_run_spy.mockResolvedValueOnce("OK");

    await index.main();

    expect(index_run_spy).toHaveBeenCalledWith(
      true,
      "sources",
      "token",
      "owner",
      "repo"
    );
    expect(core.notice).toHaveBeenCalledWith(
      "Running with noop: true, sources: sources, repo: owner/repo"
    );
    expect(core.notice).toHaveBeenCalledWith("OK");
  });

  it("catches correctly after calling run", async () => {
    const error = { message: "error" };

    core.getInput.mockImplementation((key) =>
      key == "repository" ? "owner/repo" : key
    );

    jest.spyOn(index, "run").mockRejectedValueOnce(error);

    await index.main();

    expect(core.notice).toHaveBeenCalledWith(
      "Running with noop: false, sources: sources, repo: owner/repo"
    );
    expect(core.error).toHaveBeenCalledWith(error);
    expect(core.setFailed).toHaveBeenCalledWith(error.message);
  });

  it("catches correctly in the try {}", async () => {
    core.getInput
      // Will make full_repository.split fail
      .mockImplementation(() => undefined);
    const error_message =
      "Cannot read properties of undefined (reading 'split')";
    const error = new TypeError(error_message);

    await index.main();

    expect(core.error).toHaveBeenCalledWith(error);
    expect(core.setFailed).toHaveBeenCalledWith(error_message);
  });
});

describe("run", () => {
  const sources_items = [1, 2, 3, 4];
  const created_source_result = ["ok1", "ok2", "ok3"];

  it("it resolves correctly", async () => {
    const github_setup_spy = jest.spyOn(github, "setup");

    const source_get_spy = jest.spyOn(sources, "get");
    source_get_spy.mockResolvedValueOnce(sources_items);

    const issues_create_spy = jest.spyOn(issues, "create");
    issues_create_spy.mockResolvedValueOnce(created_source_result);

    core.setOutput.mockImplementationOnce((key, value) => {
      expect(key).toBe("count");
      expect(value).toBe(3);
    });

    await expect(
      index.run(false, "sources", "token", "owner", "repo")
    ).resolves.toBe("ok1\nok2\nok3");

    expect(github_setup_spy).toHaveBeenCalledWith(
      "token",
      "owner",
      "repo",
      false
    );
    expect(source_get_spy).toHaveBeenCalledWith("sources");
    expect(issues_create_spy).toHaveBeenCalledWith(sources_items);
  });

  it("it rejects correctly", async () => {
    const github_setup_spy = jest.spyOn(github, "setup");

    const source_read_spy = jest.spyOn(sources, "read");
    source_read_spy.mockRejectedValueOnce("error");

    await expect(index.run(false, "sources", "token", "owner", "repo")).rejects.toBe(
      "error"
    );

    expect(github_setup_spy).toHaveBeenCalledWith(
      "token",
      "owner",
      "repo",
      false
    );
    expect(source_read_spy).toHaveBeenCalledWith("sources");
  });
});
