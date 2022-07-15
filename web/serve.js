//!/usr/bin/env node

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
