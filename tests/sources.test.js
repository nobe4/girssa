const core = require("@actions/core");
jest.mock("@actions/core");

const rss = require("../src/rss.js");
const github = require("../src/github.js");
const sources = require("../src/sources.js");

beforeEach(() => {
  github.noop = false;
  github.owner = "owner";
  github.repo = "repo";
});

describe("read", () => {
  it("doesn't read if nooped", async () => {
    github.noop = true;

    await expect(sources.read("path")).resolves.toBe(sources.noop_sources);

    expect(core.notice).toHaveBeenCalledWith(
      "[NOOP] Reading source file owner/repo/path"
    );
  });

  it("reads and parse the content correctly", async () => {
    const content_spy = jest.fn();
    github.client = { rest: { repos: { getContent: content_spy } } };
    content_spy.mockResolvedValueOnce({
      data: {
        content: btoa('{ "json": true }'),
      },
    });

    await expect(sources.read("path")).resolves.toStrictEqual({ json: true });

    expect(core.debug).toHaveBeenCalledWith(
      "Reading source file owner/repo/path"
    );
  });

  it("fails to read", async () => {
    const content_spy = jest.fn();
    github.client = { rest: { repos: { getContent: content_spy } } };
    content_spy.mockRejectedValueOnce("error");

    await expect(sources.read("path")).rejects.toStrictEqual("error");

    expect(core.warning).toHaveBeenCalledWith("sources.read error");
  });
});

describe("filter_results", () => {
  it("filter correctly", () => {
    const results = [
      { status: "fulfilled", value: "ok1" },
      { status: "fulfilled", value: "ok2" },
      { status: "rejected", reason: "error1" },
      { status: "fulfilled", value: "ok3" },
      { status: "rejected", reason: "error2" },
    ];
    const expected = ["ok1", "ok2", "ok3"];

    expect(sources.filter_results(results)).toStrictEqual(expected);

    expect(core.warning).toHaveBeenCalledWith("Error while processing:");
    expect(core.warning).toHaveBeenCalledWith("error1");
    expect(core.warning).toHaveBeenCalledWith("Error while processing:");
    expect(core.warning).toHaveBeenCalledWith("error2");
  });
});

describe("fetch", () => {
  it("gets and filter items correctly", async () => {
    const rss_get_spy = jest.spyOn(rss, "get");
    rss_get_spy.mockResolvedValueOnce(["value1", "value2"]);
    rss_get_spy.mockRejectedValueOnce(["value3", "value4"]);

    const source_filter_spy = jest.spyOn(sources, "filter_results");
    source_filter_spy.mockReturnValueOnce("ok");

    const items = [{ name: "source1" }, { name: "source2" }];
    await expect(sources.fetch(items)).resolves.toStrictEqual("ok");

    expect(rss_get_spy).toHaveBeenCalledWith(items[0]);
    expect(rss_get_spy).toHaveBeenCalledWith(items[0]);

    expect(source_filter_spy).toHaveBeenCalledWith([
      { status: "fulfilled", value: ["value1", "value2"] },
      { status: "rejected", reason: ["value3", "value4"] },
    ]);
    expect(core.debug).toHaveBeenCalledWith(`Processing ${items[0].name}`);
    expect(core.debug).toHaveBeenCalledWith(`Processing ${items[1].name}`);
  });

  it("rejects if there's an error", async () => {
    const rss_get_spy = jest.spyOn(rss, "get");
    rss_get_spy.mockResolvedValueOnce(["value1", "value2"]);

    const error = new Error("error");
    jest.spyOn(sources, "filter_results").mockRejectedValueOnce(error);

    await expect(sources.fetch(["source1"])).rejects.toStrictEqual(error);

    expect(core.warning).toHaveBeenCalledWith("sources.fetch error");
    expect(core.warning).toHaveBeenCalledWith(error);
  });
});

describe("get", () => {
  it("gets the items correctly", async () => {
    const sources_read_spy = jest.spyOn(sources, "read");
    sources_read_spy.mockResolvedValueOnce([1, 2, 3]);

    const sources_fetch_spy = jest.spyOn(sources, "fetch");
    sources_fetch_spy.mockResolvedValueOnce([[1], [2, 3]]);

    await expect(sources.get("sources")).resolves.toStrictEqual([1, 2, 3]);

    expect(sources_read_spy).toHaveBeenCalledWith("sources");
    expect(sources_fetch_spy).toHaveBeenCalledWith([1, 2, 3]);
  });

  it("catchs correctly", async () => {
    jest.spyOn(sources, "read").mockRejectedValueOnce("error");

    await expect(sources.get("sources")).rejects.toBe("error");
  });
});
