const github = require("../src/github.js");
const issues = require("../src/issues.js");

beforeEach(() => {
  github.noop = false;
  github.owner = "owner";
  github.repo = "repo";
});

describe("list", () => {
  it("doesn't list if nooped", async () => {
    github.noop = true;
    await expect(issues.list()).resolves.toHaveLength(0);
  });

  it("lists all the issues with pagination", async () => {
    const list_spy = jest.fn();
    const paginate_spy = jest.fn();
    github.client = {
      paginate: paginate_spy,
      rest: { issues: { listForRepo: list_spy } },
    };
    paginate_spy.mockResolvedValueOnce({ data: "OK" });

    await expect(issues.list()).resolves.toBe("OK");

    expect(paginate_spy).toHaveBeenCalledWith(list_spy, {
      owner: "owner",
      repo: "repo",
      state: "all",
    });
  });

  it("fails to list the issues", async () => {
    const list_spy = jest.fn();
    const paginate_spy = jest.fn();
    github.client = {
      paginate: paginate_spy,
      rest: { issues: { listForRepo: list_spy } },
    };

    const error = { stack: "the stack" };
    paginate_spy.mockRejectedValueOnce(error);

    await expect(issues.list()).rejects.toStrictEqual(error);
    expect(paginate_spy).toHaveBeenCalledWith(list_spy, {
      owner: "owner",
      repo: "repo",
      state: "all",
    });
  });
});

describe("select", () => {
  it("catch correctly", () => {
    jest.spyOn(issues, "list").mockRejectedValueOnce("error");

    expect(issues.select("whatever")).rejects.toStrictEqual("error");
  });

  [
    {
      name: "missing items means no items",
      items: undefined,
      issues: [],
      expected: [],
    },
    {
      name: "no items means no items",
      items: [],
      issues: [],
      expected: [],
    },
    {
      name: "no issues doesn't filter at all",
      items: [{ id: 1 }, { id: 2 }],
      issues: [],
      expected: [{ id: 1 }, { id: 2 }],
    },
    {
      name: "issues without body don't filter",
      items: [{ id: 1 }, { id: 2 }],
      issues: [{ no_body: true }],
      expected: [{ id: 1 }, { id: 2 }],
    },
    {
      name: "issues without the id in a body don't filter",
      items: [{ id: 1 }, { id: 2 }],
      issues: [{ body: "doesn't containt any id" }],
      expected: [{ id: 1 }, { id: 2 }],
    },
    {
      name: "issues with the id in a body filter",
      items: [{ id: 1 }, { id: 2 }],
      issues: [{ body: "In this string, 1 is an id" }],
      expected: [{ id: 2 }],
    },
    {
      name: "issues with the id in a two bodies filter",
      items: [{ id: 1 }, { id: 2 }],
      issues: [
        { body: "In this string, 1 is an id" },
        { body: "In this string, 2 is an id" },
      ],
      expected: [],
    },
    {
      name: "issues with multiple ids in a body filter",
      items: [{ id: 1 }, { id: 2 }],
      issues: [
        { body: "In this string, 1 is an id" },
        { body: "In this string, 2 is an id" },
      ],
      expected: [],
    },
    {
      name: "issues with the id in a complex body filter",
      items: [{ id: 1 }, { id: 2 }],
      issues: [
        {
          body: "http://example.com is a fascinating website @)&(*=!@(&*=!ID HERE 1 ID HERE@)&(=*!@(&*=!",
        },
        { body: "In this string, 2 is an id" },
      ],
      expected: [],
    },
  ].forEach((test) => {
    it(`works for ${test.name}`, async () => {
      issues.list = jest.fn().mockResolvedValueOnce(test.issues);
      await expect(issues.select(test.items)).resolves.toStrictEqual(
        test.expected
      );
    });
  });
});

describe("format", () => {
  it("formats the body correctly", () => {
    const item = {
      source: {
        name: "name",
        rss_url: "rss_url",
        url: "url",
      },
      id: "id",
      link: "link",
      title: "title",
      content: "content",
      published: 1044072306000, // 01/02/2003, 04:05:06
    };

    const expected = [
      "<!-- id -->",
      "| [name](url) | [original](link) | 01/02/2003, 04:05:06 |",
      "| --- | --- | --- |",
      "",
      "content",
    ].join("\n");

    expect(issues.format_body(item)).toStrictEqual(expected);
  });
});

describe("create_one", () => {
  const item = {
    source: {
      name: "name",
    },
    title: "title",
    id: "id",
    content: "content",
    link: "link",
    published: "published",
  };

  const issue_data = {
    owner: "owner",
    repo: "repo",
    title: "title",
    body: "body",
    labels: ["name"],
  };

  it("doesn't create if nooped", () => {
    github.noop = true;

    expect(issues.create_one(item)).resolves.toMatch(
      "[NOOP] Created issue for: 'title'"
    );
  });

  it("create an issue from the item correctly", async () => {
    const create_spy = jest.fn();
    github.client = { rest: { issues: { create: create_spy } } };

    create_spy.mockResolvedValueOnce({
      data: {
        html_url: "html_url",
      },
    });

    const format_body_spy = jest.spyOn(issues, "format_body");
    format_body_spy.mockReturnValueOnce("body");

    await expect(issues.create_one(item)).resolves.toBe(
      "Created issue for: 'title'\nhtml_url"
    );

    expect(format_body_spy).toHaveBeenCalledWith(item);
    expect(create_spy).toHaveBeenCalledWith(issue_data);
  });

  it("fails to create an issue", async () => {
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

    await expect(issues.create_one(item)).resolves.toBe(
      "Error creating issue for: 'title'\nstatus: message"
    );

    expect(format_body_spy).toHaveBeenCalledWith(item);
    expect(create_spy).toHaveBeenCalledWith(issue_data);
  });
});

describe("create", () => {
  it("selects and maps the items to create_one", async () => {
    const select_spy = jest.spyOn(issues, "select");
    select_spy.mockResolvedValueOnce(["item1", "item2"]);

    const create_one_spy = jest.spyOn(issues, "create_one");
    create_one_spy.mockResolvedValueOnce("ok1");
    create_one_spy.mockResolvedValueOnce("ok2");

    await expect(
      issues.create(["item1", "item2", "item3"])
    ).resolves.toStrictEqual(["ok1", "ok2"]);

    expect(select_spy).toHaveBeenCalledWith(["item1", "item2", "item3"]);
    expect(create_one_spy).toHaveBeenCalledWith("item1", 0, ["item1", "item2"]);
    expect(create_one_spy).toHaveBeenCalledWith("item2", 1, ["item1", "item2"]);
  });
});
