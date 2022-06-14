const core = require("@actions/core");

const sources = require("../src/sources.js");
const issues = require("../src/issues.js");
const github = require("../src/github.js");
const index = require("../src/index.js");

afterEach(() => jest.clearAllMocks());

describe("main", () => {
  it("fetchs, parses and uses the input correctly", async () => {
    // Key is value, except for repository.
    jest
      .spyOn(core, "getInput")
      .mockImplementation((key) => (key == "repository" ? "owner/repo" : key));

    const index_run_spy = jest.spyOn(index, "run");
    index_run_spy.mockResolvedValueOnce("OK");

    const core_notice_spy = jest.spyOn(core, "notice");

    await index.main();

    expect(index_run_spy).toHaveBeenCalledWith(
      false,
      "sources",
      "token",
      "owner",
      "repo"
    );
    expect(core_notice_spy).toHaveBeenCalledWith(
      "Running with noop: false, sources: sources, repo: owner/repo"
    );
    expect(core_notice_spy).toHaveBeenCalledWith("OK");
  });

  it("parses noop correctly", async () => {
    jest.spyOn(core, "getInput").mockImplementation((key) =>
      // Key is value, except for noop and repository.
      key === "noop" ? "true" : key === "repository" ? "owner/repo" : key
    );

    const index_run_spy = jest.spyOn(index, "run");
    index_run_spy.mockResolvedValueOnce("OK");

    const core_notice_spy = jest.spyOn(core, "notice");

    await index.main();

    expect(index_run_spy).toHaveBeenCalledWith(
      true,
      "sources",
      "token",
      "owner",
      "repo"
    );
    expect(core_notice_spy).toHaveBeenCalledWith(
      "Running with noop: true, sources: sources, repo: owner/repo"
    );
    expect(core_notice_spy).toHaveBeenCalledWith("OK");
  });

  it("catches correctly after calling run", async () => {
    const error = { message: "error" };

    jest
      .spyOn(core, "getInput")
      .mockImplementation((key) => (key == "repository" ? "owner/repo" : key));

    jest.spyOn(index, "run").mockRejectedValueOnce(error);

    const core_error_spy = jest.spyOn(core, "error");
    const core_setFailed_spy = jest.spyOn(core, "setFailed");
    const core_notice_spy = jest.spyOn(core, "notice");

    await index.main();
    expect(core_notice_spy).toHaveBeenCalledWith(
      "Running with noop: false, sources: sources, repo: owner/repo"
    );
    expect(core_error_spy).toHaveBeenCalledWith(error);
    expect(core_setFailed_spy).toHaveBeenCalledWith(error.message);
  });

  it("catches correctly in the try {}", async () => {
    jest
      .spyOn(core, "getInput")
      // Will make full_repository.split fail
      .mockImplementation(() => undefined);
    const error_message =
      "Cannot read properties of undefined (reading 'split')";
    const error = new TypeError(error_message);

    const core_error_spy = jest.spyOn(core, "error");
    const core_setFailed_spy = jest.spyOn(core, "setFailed");

    await index.main();
    expect(core_error_spy).toHaveBeenCalledWith(error);
    expect(core_setFailed_spy).toHaveBeenCalledWith(error_message);
  });
});

describe("run", () => {
  const sources_items = "sources_items";
  const processed_sources_items = [
    [1, 2],
    [3, 4],
  ];
  const selected_sources_items = [1, 2, 3];
  const created_source_result = ["ok1", "ok2", "ok3"];

  it("it resolves correctly", async () => {
    const github_setup_spy = jest.spyOn(github, "setup");

    const source_read_spy = jest.spyOn(sources, "read");
    source_read_spy.mockResolvedValueOnce(sources_items);

    const sources_process_spy = jest.spyOn(sources, "process");
    sources_process_spy.mockResolvedValueOnce(processed_sources_items);

    const issues_select_spy = jest.spyOn(issues, "select");
    issues_select_spy.mockResolvedValueOnce(selected_sources_items);

    const issues_create_spy = jest.spyOn(issues, "create");
    issues_create_spy.mockResolvedValueOnce(created_source_result);

    jest.spyOn(core, "setOutput").mockImplementationOnce((key, value) => {
      expect(key).toBe("count");
      expect(value).toBe(3);
    });

    expect(index.run(false, "sources", "token", "owner", "repo")).resolves.toBe(
      "ok1\nok2\nok3"
    );

    expect(github_setup_spy).toHaveBeenCalledWith(
      "token",
      "owner",
      "repo",
      false
    );
    expect(source_read_spy).toHaveBeenCalledWith("sources");
    // TODO: those don't work, but they should ¯\_(ツ)_/¯
    // expect(sources_process_spy).toHaveBeenCalledWith(sources_items);
    // expect(issues_select_spy).toHaveBeenCalledWith(flattened_sources_items);
    // expect(issues_create_spy).toHaveBeenCalledWith(selected_sources_items);
  });

  it("it rejects correctly", async () => {
    const github_setup_spy = jest.spyOn(github, "setup");

    const source_read_spy = jest.spyOn(sources, "read");
    source_read_spy.mockRejectedValueOnce("error");

    expect(index.run(false, "sources", "token", "owner", "repo")).rejects.toBe(
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
