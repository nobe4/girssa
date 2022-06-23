//!/usr/bin/env node

const { AES } = require("crypto-js");
const { readFile, writeFile } = require("fs");

const get_env = (name) => {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name} env variable`);
    process.exit(1);
  }
  return value;
};

const file_path = get_env("FILE").trim();
const password = get_env("PASSWORD").trim();
const token = get_env("TOKEN").trim();
const repository = get_env("REPOSITORY").trim();
const encrypted_repository = AES.encrypt(repository, password).toString();
const encrypted_token = AES.encrypt(token, password).toString();

readFile(file_path, "utf-8", function (err, contents) {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  const replaced = contents
    .replace("ENCRYPTED_TOKEN_TO_INJECT", encrypted_token)
    .replace("ENCRYPTED_REPOSITORY_TO_INJECT", encrypted_repository);

  writeFile(file_path, replaced, "utf-8", function (err) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
});
