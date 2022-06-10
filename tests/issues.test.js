const github = require("@actions/github");

const issues = require("../src/issues.js");

afterEach(() => jest.clearAllMocks());

describe("setup", () => {
  it("setup the client, owner and repo correctly", () => {
    expect(issues.client).toBeUndefined();
    expect(issues.owner).toBeUndefined();
    expect(issues.repo).toBeUndefined();

    jest.spyOn(github, "getOctokit").mockReturnValueOnce("client");
    issues.setup("token", "owner", "repo");
    expect(issues.client).toBe("client");
    expect(issues.owner).toBe("owner");
    expect(issues.repo).toBe("repo");
  });
});

describe("list", () => {
  it("lists all the repo", () => {
    const list_spy = jest.fn();
    issues.client = { rest: { issues: { listForRepo: list_spy } } };

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
  it("create an issue from the item correctly", () => {
    const create_spy = jest.fn();
    issues.client = { rest: { issues: { create: create_spy } } };
    issues.owner = "owner";
    issues.repo = "repo";

    create_spy.mockResolvedValueOnce({
      data: {
        html_url: "html_url",
      },
    });

    expect(
      issues.create_one({
        title: "title",
        id: "id",
        content: "content",
        link: "link",
        published: "published",
      })
    ).resolves.toBe("Created issue for: 'title - id'\nhtml_url");

    expect(create_spy).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      title: "title - id",
      body: "link\n\ncontent\n\npublished",
    });
  });

  it("fails to create an issue", () => {
    const create_spy = jest.fn();
    issues.client = { rest: { issues: { create: create_spy } } };
    issues.owner = "owner";
    issues.repo = "repo";

    create_spy.mockRejectedValueOnce({
      response: {
        status: "status",
        data: {
          message: "message",
        },
      },
    });

    expect(
      issues.create_one({
        title: "title",
        id: "id",
        content: "content",
        link: "link",
        published: "published",
      })
    ).resolves.toBe("Error creating issue for: 'title - id'\nstatus: message");

    expect(create_spy).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
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
