//!/usr/bin/env nodejs

//
// Test the parsing of a feed URL.
// Will fetch and parse the feed and display the first item
//
// Usage:
//  - node test_feed.js SOURCES.JSON
//

const rss = require("../src/rss.js");
const fs = require("fs");

var sources = process.argv.slice(2)[0];

fs.readFile(sources, "utf8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  JSON.parse(data).forEach((item) => {
    rss
      .get(item)
      .then((items) => console.log(items[0]))
      .catch(console.error);
  });
});
