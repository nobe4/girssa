//!/usr/bin/env node

//
// serve.js
// Create a very simple HTTP Server that injects secrets at query-time.
//
// Use TOKEN and REPOSITORY environment variables to inject into the template.
//
// e.g.
//   TOKEN=REDACTED REPOSITORY=nobe4/girssa node serve.js
//

const { createServer: serve } = require("http");
const { readFile: read } = require("fs");
const { AES } = require("crypto-js");
const get_env = require("./get_env.js");

const port = 8080;
const token = get_env("TOKEN").trim();
const repository = get_env("REPOSITORY").trim();
const password = "password";
const encrypted_repository = AES.encrypt(repository, password).toString();
const encrypted_token = AES.encrypt(token, password).toString();

serve(function (req, res) {
  // Default to index.html
  if (req.url == "/") {
    req.url = "/index.html";
  }

  read(__dirname + req.url, "utf-8", function (err, contents) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }

    const replaced = contents
      .replace("ENCRYPTED_TOKEN_TO_INJECT", encrypted_token)
      .replace("ENCRYPTED_REPOSITORY_TO_INJECT", encrypted_repository);

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(replaced);
  });
}).listen(port);

console.log(`Listening on http://localhost:${port}`);
console.log(`Password is 'password'`);
