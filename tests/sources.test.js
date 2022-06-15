const rss = require("../src/rss.js");
const github = require("../src/github.js");
const sources = require("../src/sources.js");

beforeEach(() => {
  github.noop = false;
  github.owner = "owner";
  github.repo = "repo";
});

describe("read", () => {
  it("doesn't read if nooped", () => {
    github.noop = true;
    expect(sources.read("path")).resolves.toBe(sources.noop_sources);
  });

  it("reads and parse the content correctly", () => {
    const content_spy = jest.fn();
    github.client = { rest: { repos: { getContent: content_spy } } };
    content_spy.mockResolvedValueOnce({
      data: {
        content: btoa('{ "json": true }'),
      },
    });

    expect(sources.read("path")).resolves.toStrictEqual({ json: true });
  });

  it("fails to read", () => {
    const content_spy = jest.fn();
    github.client = { rest: { repos: { getContent: content_spy } } };
    content_spy.mockRejectedValueOnce("error");

    expect(sources.read("path")).rejects.toStrictEqual("error");
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
  });
});

describe("fetch", () => {
  it("gets and filter items correctly", async () => {
    const rss_get_spy = jest.spyOn(rss, "get");
    rss_get_spy.mockResolvedValueOnce(["value1", "value2"]);
    rss_get_spy.mockRejectedValueOnce(["value3", "value4"]);

    const source_filter_spy = jest.spyOn(sources, "filter_results");
    source_filter_spy.mockReturnValueOnce("ok");

    await expect(sources.fetch(["source1", "source2"])).resolves.toStrictEqual(
      "ok"
    );

    expect(source_filter_spy).toHaveBeenCalledWith([
      { status: "fulfilled", value: ["value1", "value2"] },
      { status: "rejected", reason: ["value3", "value4"] },
    ]);
  });

  it("rejects if there's an error", async () => {
    const error = { stack: "the stack" };
    const rss_get_spy = jest.spyOn(rss, "get");
    rss_get_spy.mockResolvedValueOnce(["value1", "value2"]);

    jest.spyOn(sources, "filter_results").mockImplementationOnce(() => {
      throw error;
    });

    await expect(sources.fetch(["source1"])).rejects.toStrictEqual(error);
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
