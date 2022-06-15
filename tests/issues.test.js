const github = require("../src/github.js");
const issues = require("../src/issues.js");

beforeEach(() => {
  github.noop = false;
  github.owner = "owner";
  github.repo = "repo";
});

afterEach(() => jest.clearAllMocks());

describe("list", () => {
  it("doesn't list if nooped", () => {
    github.noop = true;
    expect(issues.list()).resolves.toHaveLength(0);
  });

  it("lists all the issues", () => {
    const list_spy = jest.fn();
    github.client = { rest: { issues: { listForRepo: list_spy } } };

    list_spy.mockResolvedValueOnce({ data: "OK" });
    expect(issues.list()).resolves.toBe("OK");
  });

  it("fails to list the issues", () => {
    const list_spy = jest.fn();
    github.client = { rest: { issues: { listForRepo: list_spy } } };

    const error = { stack: "the stack" };
    list_spy.mockRejectedValueOnce(error);

    expect(issues.list()).rejects.toStrictEqual(error);
  });
});

describe("select", () => {
  it("filters the items based on the issues list", () => {
    jest
      .spyOn(issues, "list")
      .mockResolvedValueOnce([{ body: "id2" }, { body: "id3" }]);

    expect(
      issues.select([
        { id: "id1" },
        { id: "id2" },
        { id: "id3" },
        { id: "id4" },
      ])
    ).resolves.toStrictEqual([{ id: "id1" }, { id: "id4" }]);
  });

  it("works when some issues don't have bodies", () => {
    jest
      .spyOn(issues, "list")
      .mockResolvedValueOnce([{ body: "id2" }, { no_body: true }]);

    expect(
      issues.select([{ id: "id1" }, { id: "id2" }, { id: "id3" }])
    ).resolves.toStrictEqual([{ id: "id1" }, { id: "id3" }]);
  });

  it("works when no issues are found", () => {
    jest.spyOn(issues, "list").mockResolvedValueOnce([]);
    const items = [{ id: "id1" }, { id: "id2" }, { id: "id3" }, { id: "id4" }];

    expect(issues.select(items)).resolves.toStrictEqual(items);
  });
});

describe("format", () => {
  it("formats the body correctly", () => {
    const item = {
      id: "id",
      link: "link",
      title: "title",
      content: "content",
      published: 1044072306000, // 01/02/2003, 04:05:06
    };

    const expected = [
      "<!-- id -->",
      "| source (link) TODO | [original](link) | 01/02/2003, 04:05:06 |",
      "| --- | --- | --- | --- |",
      "",
      "content",
    ].join("\n");

    expect(issues.format_body(item)).toStrictEqual(expected);
  });
});

describe("create_one", () => {
  const item = {
    title: "title",
    id: "id",
    content: "content",
    link: "link",
    published: "published",
  };

  it("doesn't create if nooped", () => {
    github.noop = true;

    expect(issues.create_one(item)).resolves.toStrictEqual(
      "[NOOP] Created issue for: 'title'"
    );
  });

  it("create an issue from the item correctly", () => {
    const create_spy = jest.fn();
    github.client = { rest: { issues: { create: create_spy } } };

    create_spy.mockResolvedValueOnce({
      data: {
        html_url: "html_url",
      },
    });

    const format_body_spy = jest.spyOn(issues, "format_body");
    format_body_spy.mockReturnValueOnce("body");

    expect(issues.create_one(item)).resolves.toBe(
      "Created issue for: 'title'\nhtml_url"
    );

    expect(format_body_spy).toHaveBeenCalledWith(item);
    expect(create_spy).toHaveBeenCalledWith({
      owner: github.owner,
      repo: github.repo,
      title: "title",
      body: "body",
    });
  });

  it("fails to create an issue", () => {
    const create_spy = jest.fn();
    github.client = { rest: { issues: { create: create_spy } } };

    create_spy.mockRejectedValueOnce({
      response: {
        status: "status",
        data: {
          message: "message",
        },
      },
    });

    const format_body_spy = jest.spyOn(issues, "format_body");
    format_body_spy.mockReturnValueOnce("body");

    expect(issues.create_one(item)).resolves.toBe(
      "Error creating issue for: 'title'\nstatus: message"
    );

    expect(format_body_spy).toHaveBeenCalledWith(item);
    expect(create_spy).toHaveBeenCalledWith({
      owner: github.owner,
      repo: github.repo,
      title: "title",
      body: "body",
    });
  });
});

describe("create", () => {
  it("maps the items to create_one", () => {
    const create_one_spy = jest.spyOn(issues, "create_one");
    create_one_spy.mockResolvedValueOnce("ok1");
    create_one_spy.mockResolvedValueOnce("ok2");
    create_one_spy.mockResolvedValueOnce("ok3");

    expect(issues.create(["item1", "item2", "item3"])).resolves.toStrictEqual([
      "ok1",
      "ok2",
      "ok3",
    ]);
  });
});
