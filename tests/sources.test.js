const fs = require("fs");
const rss = require("../src/rss.js");

const sources = require("../src/sources.js");

describe("read", () => {
  it("reads and parse the content correctly", () => {
    jest.spyOn(fs, "readFile").mockImplementationOnce((path, encoding, cb) => {
      expect(path).toStrictEqual("path");
      expect(encoding).toStrictEqual("utf8");
      cb(undefined, `{"json": true}`);
    });

    expect(sources.read("path")).resolves.toStrictEqual({ json: true });
  });

  it("cannot read", () => {
    jest.spyOn(fs, "readFile").mockImplementationOnce((path, encoding, cb) => {
      cb("error", undefined);
    });

    expect(sources.read("path")).rejects.toBe("error");
  });

  it("reads correctly and fail parsing the content", () => {
    jest.spyOn(fs, "readFile").mockImplementationOnce((path, encoding, cb) => {
      cb(undefined, `not json`);
    });

    sources.read("path").catch((e) => {
      expect(e instanceof SyntaxError).toBeTruthy();
    });
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

describe("process", () => {
  it("get and filter items correctly", async () => {
    const rss_get_spy = jest.spyOn(rss, "get");
    rss_get_spy.mockResolvedValueOnce(["value1", "value2"]);
    rss_get_spy.mockRejectedValueOnce(["value3", "value4"]);

    const source_filter_spy = jest.spyOn(sources, "filter_results");
    source_filter_spy.mockReturnValueOnce("ok");

    await expect(
      sources.process(["source1", "source2"])
    ).resolves.toStrictEqual("ok");

    expect(source_filter_spy).toHaveBeenCalledWith([
      { status: "fulfilled", value: ["value1", "value2"] },
      { status: "rejected", reason: ["value3", "value4"] },
    ]);
  });
});
