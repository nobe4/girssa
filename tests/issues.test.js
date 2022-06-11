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

  it("lists all the repo", () => {
    const list_spy = jest.fn();
    github.client = { rest: { issues: { listForRepo: list_spy } } };

    list_spy.mockResolvedValueOnce({ data: "OK" });
    expect(issues.list()).resolves.toBe("OK");
  });
});

describe("select", () => {
  it("filters the items based on the issues list", () => {
    jest
      .spyOn(issues, "list")
      .mockResolvedValueOnce([{ title: "id2" }, { title: "id3" }]);

    expect(
      issues.select([
        { id: "id1" },
        { id: "id2" },
        { id: "id3" },
        { id: "id4" },
      ])
    ).resolves.toStrictEqual([{ id: "id1" }, { id: "id4" }]);
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
      "[NOOP] Created issue for: 'title - id'"
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

    expect(issues.create_one(item)).resolves.toBe(
      "Created issue for: 'title - id'\nhtml_url"
    );

    expect(create_spy).toHaveBeenCalledWith({
      owner: github.owner,
      repo: github.repo,
      title: "title - id",
      body: "link\n\ncontent\n\npublished",
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

    expect(issues.create_one(item)).resolves.toBe(
      "Error creating issue for: 'title - id'\nstatus: message"
    );

    expect(create_spy).toHaveBeenCalledWith({
      owner: github.owner,
      repo: github.repo,
      title: "title - id",
      body: "link\n\ncontent\n\npublished",
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
