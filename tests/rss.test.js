const core = require("@actions/core");
jest.mock("@actions/core");

const https = require("https");

const rss = require("../src/rss.js");
const parser = require("../src/parser.js");

const source = {
  name: "name",
  url: "url",
  rss_url: "rss_url",
};

describe("fetch", () => {
  it("rejects a non-200 status code", async () => {
    jest.spyOn(https, "get").mockImplementationOnce((url, options, cb) => {
      expect(url).toBe("URL");
      expect(options).toBe(rss.get_options);
      cb({ statusCode: 500 });
    });

    await expect(rss.fetch("URL")).rejects.toMatch(/Request Failed/);

    expect(core.debug).toHaveBeenCalledWith("Fetching URL");
  });

  it("reject if the request has an error", async () => {
    const error = new Error("error");

    https.get = function (url, options) {
      expect(url).toBe("URL");
      expect(options).toBe(rss.get_options);

      return {
        on: jest.fn((event, cb) => {
          expect(event).toBe("error");
          cb(error);
        }),
        end: jest.fn(),
      };
    };

    await expect(rss.fetch("URL")).rejects.toBe(error);

    expect(core.debug).toHaveBeenCalledWith("Fetching URL");
    expect(core.warning).toHaveBeenCalledWith("rss.fetch error");
    expect(core.warning).toHaveBeenCalledWith(error);
  });

  it("reads the body correctly", async () => {
    const setEncodingMock = jest.fn();
    const onMock = jest.fn((event, cb) => {
      if (event === "data") {
        cb("body");
      } else if (event === "end") {
        cb();
      }
    });

    https.get = jest.fn().mockImplementationOnce((url, options, cb) => {
      expect(url).toBe("URL");
      expect(options).toBe(rss.get_options);
      cb({
        statusCode: 200,
        setEncoding: setEncodingMock,
        on: onMock,
      });
    });

    await expect(rss.fetch("URL")).resolves.toBe("body");

    expect(setEncodingMock).toHaveBeenCalledWith("utf8");
  });
});

describe("get", () => {
  it("works and resolve", async () => {
    const rss_fetch_spy = jest.spyOn(rss, "fetch");
    rss_fetch_spy.mockResolvedValueOnce("data");

    const parser_parse_spy = jest.spyOn(parser, "parse");
    parser_parse_spy.mockResolvedValueOnce("OK");

    await expect(rss.get(source)).resolves.toBe("OK");
    expect(rss_fetch_spy).toHaveBeenCalledWith("rss_url");
    expect(parser_parse_spy).toHaveBeenCalledWith("data", source);
  });

  it("fails and rejects", async () => {
    jest.spyOn(rss, "fetch").mockRejectedValueOnce("error");
    await expect(rss.get(source)).rejects.toStrictEqual({
      error: "error",
      source: source,
    });
  });
});
