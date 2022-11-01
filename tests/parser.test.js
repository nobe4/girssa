const core = require("@actions/core");
jest.mock("@actions/core");

const fs = require("fs");
const { XMLParser } = require("fast-xml-parser");

const parser = require("../src/parser.js");

const source = {
  name: "name",
  url: "url",
  rss_url: "rss_url",
};

describe("parse_content", () => {
  [
    { description: "content" },
    { summary: "content" },
    { content: "content" },
    { "media:group": { "media:description": "content" } },
  ].forEach((item) => {
    it(`works for ${JSON.stringify(item)}`, () => {
      expect(parser.parse_content(item)).toBe("content");
    });
  });

  [{}, { "media:group": "content" }].forEach((item) => {
    it(`is undefined for ${JSON.stringify(item)}`, () => {
      expect(parser.parse_content(item)).toBeUndefined();
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
        expect(parser.parse_published(item)).toBe(parsed_today);
      });
    }
  );
});

describe("parse_link", () => {
  [
    // Link is a string
    { item: { link: "link" }, expected: "link" },
    { item: { link: "" }, expected: undefined },

    // Link is an object
    { item: { link: { "@_href": "link" } }, expected: "link" },
    { item: { link: {} }, expected: undefined },

    { item: { not_link: "link" }, expected: undefined },
    {
      item: { "yt:videoId": "id" },
      expected: "https://www.youtube.com/watch?v=id",
    },
  ].forEach((t) => {
    it(`works for ${JSON.stringify(t.item)}`, () => {
      expect(parser.parse_link(t.item)).toBe(t.expected);
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
      jest.spyOn(parser, "parse_content").mockReturnValueOnce("content");
      jest.spyOn(parser, "parse_published").mockReturnValueOnce("published");

      expect(parser.parse_item(item, source)).toEqual(expected);
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

    expect(parser.parse("raw_data", source)).rejects.toMatch("invalid XML");

    // This time without the mock
    expect(parser.parse("raw_data", source)).rejects.toMatch("invalid XML");
  });

  it("calls parser.parse_item on each found item in an RSS feed", () => {
    jest
      .spyOn(XMLParser.prototype, "parse")
      .mockReturnValueOnce({ rss: { channel: { item: [1, 2, 3] } } });

    jest
      .spyOn(parser, "parse_item")
      .mockReturnValueOnce("parsed_1")
      .mockReturnValueOnce("parsed_2")
      .mockReturnValueOnce("parsed_3");

    expect(parser.parse("data", source)).resolves.toStrictEqual([
      "parsed_1",
      "parsed_2",
      "parsed_3",
    ]);
  });

  it("calls parser.parse_item on each found item in an ATOM feed", () => {
    jest
      .spyOn(XMLParser.prototype, "parse")
      .mockReturnValueOnce({ feed: { entry: [1, 2, 3] } });

    jest
      .spyOn(parser, "parse_item")
      .mockReturnValueOnce("parsed_1")
      .mockReturnValueOnce("parsed_2")
      .mockReturnValueOnce("parsed_3");

    expect(parser.parse("data", source)).resolves.toStrictEqual([
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

    jest.spyOn(parser, "parse_item").mockReturnValueOnce("parsed_1");
    expect(parser.parse("data")).resolves.toStrictEqual(["parsed_1"]);
  });

  it("works if there's only one item", () => {
    // 2nd and 3rd channels are going to be ignored, so we can leave them empty
    jest
      .spyOn(XMLParser.prototype, "parse")
      .mockReturnValueOnce({ rss: { channel: { item: 1 } } });

    jest.spyOn(parser, "parse_item").mockReturnValueOnce("parsed_1");
    expect(parser.parse("data")).resolves.toStrictEqual(["parsed_1"]);
  });

  it("works if there's no item", () => {
    jest
      .spyOn(XMLParser.prototype, "parse")
      .mockReturnValueOnce({ rss: { channel: { item: [] } } });

    expect(parser.parse("data", { name: "name" })).resolves.toStrictEqual([]);
    expect(core.warning).toHaveBeenCalledWith("No items found for 'name'.");
  });

  it("works for an XML document", () => {
    const rss_feed = fs.readFileSync("tests/fixtures/rss_feed.xml").toString();

    parser.parse(rss_feed).then((data) => {
      expect(data).toHaveLength(2);
      expect(data[0].published).toBe(1654079316000);
      expect(data[1].published).toBe(1654078660000);
    });
  });

  it("works for an XML document", () => {
    const atom_feed = fs
      .readFileSync("tests/fixtures/atom_feed.xml")
      .toString();

    parser.parse(atom_feed).then((data) => {
      expect(data).toHaveLength(2);
      expect(data[0].published).toBe(1640995200000);
      expect(data[1].published).toBe(1640995200000);
    });
  });
});
