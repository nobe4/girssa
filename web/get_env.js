//!/usr/bin/env node

module.exports = (name) => {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name} env variable`);
    process.exit(1);
  }
  return value;
};
