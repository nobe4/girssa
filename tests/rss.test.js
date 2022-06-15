const fs = require("fs");
const https = require("https");
const { XMLParser } = require("fast-xml-parser");

const rss = require("../src/rss.js");

const source = "source";

describe("fetch", () => {
  it("rejects a non-200 status code", async () => {
    jest.spyOn(https, "get").mockImplementationOnce((url, cb) => {
      expect(url).toBe("URL");
      cb({ statusCode: 500 });
    });

    await expect(rss.fetch("URL")).rejects.toMatch(/Request Failed/);
  });

  it("reject if the request has an error", async () => {
    const error = { stack: "the stack" };

    https.get = function (url) {
      expect(url).toBe("URL");

      return {
        on: jest.fn((event, cb) => {
          expect(event).toBe("error");
          cb(error);
        }),
        end: jest.fn(),
      };
    };

    await expect(rss.fetch("URL")).rejects.toBe(error);
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

    https.get = jest.fn().mockImplementationOnce((url, cb) => {
      expect(url).toBe("URL");
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

describe("parse_content", () => {
  [
    { description: "content" },
    { summary: "content" },
    { content: "content" },
    { "media:group": { "media:description": "content" } },
  ].forEach((item) => {
    it(`works for ${JSON.stringify(item)}`, () => {
      expect(rss.parse_content(item)).toBe("content");
    });
  });

  [{}, { "media:group": "content" }].forEach((item) => {
    it(`is undefined for ${JSON.stringify(item)}`, () => {
      expect(rss.parse_content(item)).toBeUndefined();
    });
  });
});

describe("parse_published", () => {
  const today = "2022-01-01";
  const parsed_today = Date.parse(today);
  jest.useFakeTimers().setSystemTime(parsed_today);

  [{ created: today }, { pubDate: today }, { no_date: true }].forEach(
    (item) => {
      it(`works for ${JSON.stringify(item)}`, () => {
        expect(rss.parse_published(item)).toBe(parsed_today);
      });
    }
  );
});

describe("parse_link", () => {
  [
    { item: { link: "link" }, expected: "link" },
    { item: { link: "" }, expected: undefined },
    { item: { not_link: "link" }, expected: undefined },
    {
      item: { "yt:videoId": "id" },
      expected: "https://www.youtube.com/watch?v=id",
    },
  ].forEach((t) => {
    it(`works for ${JSON.stringify(t.item)}`, () => {
      expect(rss.parse_link(t.item)).toBe(t.expected);
    });
  });
});

describe("parse_item", () => {
  const expected = {
    source: source,
    id: "id",
    title: "title",
    link: "link",
    content: "content",
    published: "published",
  };

  const tests = [
    {
      guid: "id",
      title: "title",
      link: "link",
    },
    {
      id: "id",
      title: "title",
      link: "link",
    },
  ];

  tests.forEach((item) => {
    it(`works for ${JSON.stringify(item)}`, () => {
      jest.spyOn(rss, "parse_content").mockReturnValueOnce("content");
      jest.spyOn(rss, "parse_published").mockReturnValueOnce("published");

      expect(rss.parse_item(item, source)).toEqual(expected);
    });
  });
});

describe("parse", () => {
  it("rejects for invalid xml", () => {
    jest
      .spyOn(XMLParser.prototype, "parse")
      .mockImplementationOnce((raw_data) => {
        expect(raw_data).toBe("raw_data");
        // Invalid XML produces an empty object
        return {};
      });

    expect(rss.parse("raw_data")).rejects.toMatch("invalid XML");

    // This time without the mock
    expect(rss.parse("raw_data")).rejects.toMatch("invalid XML");
  });

  it("calls rss.parse_item on each found item in an RSS feed", () => {
    jest
      .spyOn(XMLParser.prototype, "parse")
      .mockReturnValueOnce({ rss: { channel: { item: [1, 2, 3] } } });

    jest
      .spyOn(rss, "parse_item")
      .mockReturnValueOnce("parsed_1")
      .mockReturnValueOnce("parsed_2")
      .mockReturnValueOnce("parsed_3");

    expect(rss.parse("data", source)).resolves.toStrictEqual([
      "parsed_1",
      "parsed_2",
      "parsed_3",
    ]);
  });

  it("calls rss.parse_item on each found item in an ATOM feed", () => {
    jest
      .spyOn(XMLParser.prototype, "parse")
      .mockReturnValueOnce({ feed: { entry: [1, 2, 3] } });

    jest
      .spyOn(rss, "parse_item")
      .mockReturnValueOnce("parsed_1")
      .mockReturnValueOnce("parsed_2")
      .mockReturnValueOnce("parsed_3");

    expect(rss.parse("data", source)).resolves.toStrictEqual([
      "parsed_1",
      "parsed_2",
      "parsed_3",
    ]);
  });

  it("works if there's multiple channels", () => {
    // 2nd and 3rd channels are going to be ignored, so we can leave them empty
    jest
      .spyOn(XMLParser.prototype, "parse")
      .mockReturnValueOnce({ rss: { channel: [{ item: [1] }, {}, {}] } });

    jest.spyOn(rss, "parse_item").mockReturnValueOnce("parsed_1");
    expect(rss.parse("whatever")).resolves.toStrictEqual(["parsed_1"]);
  });

  it("works if there's only one item", () => {
    // 2nd and 3rd channels are going to be ignored, so we can leave them empty
    jest
      .spyOn(XMLParser.prototype, "parse")
      .mockReturnValueOnce({ rss: { channel: { item: 1 } } });

    jest.spyOn(rss, "parse_item").mockReturnValueOnce("parsed_1");
    expect(rss.parse("whatever")).resolves.toStrictEqual(["parsed_1"]);
  });

  it("works for an XML document", () => {
    const rss_feed = fs.readFileSync("tests/fixtures/rss_feed.xml").toString();

    rss.parse(rss_feed).then((data) => {
      expect(data).toHaveLength(2);
      expect(data[0].published).toBe(1654079316000);
      expect(data[1].published).toBe(1654078660000);
    });
  });

  it("works for an XML document", () => {
    const atom_feed = fs
      .readFileSync("tests/fixtures/atom_feed.xml")
      .toString();

    rss.parse(atom_feed).then((data) => {
      expect(data).toHaveLength(2);
      expect(data[0].published).toBe(1640995200000);
      expect(data[1].published).toBe(1640995200000);
    });
  });
});

describe("get", () => {
  it("works and resolve", () => {
    jest.spyOn(rss, "fetch").mockResolvedValueOnce("data");
    jest.spyOn(rss, "parse").mockResolvedValueOnce("OK");
    expect(rss.get("url")).resolves.toBe("OK");
  });

  it("fails and rejects", () => {
    jest.spyOn(rss, "fetch").mockRejectedValueOnce("error");
    expect(rss.get("url")).rejects.toBe("error");
  });
});
