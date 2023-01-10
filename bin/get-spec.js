const path = require('path');
const fse = require('fs-extra');
const yargs = require('yargs');
const fetch = require('node-fetch');
const { hideBin } = require('yargs/helpers');
const chalk = require('chalk');

const { argv } = yargs(hideBin(process.argv));

module.exports.getSpecFromFile = async (partialSpecPath) => {
  const specPath = path.isAbsolute(partialSpecPath)
    ? partialSpecPath
    : path.join(process.cwd(), partialSpecPath);

  if (!fse.existsSync(specPath)) {
    throw new Error(`No spec found at ${specPath}`);
  }

  const json = fse.readJSONSync(specPath);

  console.info(chalk.gray(`OpenAPI specification loaded from ${specPath}`));

  return json;
};

/**
 * Generate all the things.
 */
module.exports.getOapiSpec = async () => {
  if (argv.f) {
    return this.getSpecFromFile(argv.f);
  }

  const [url] = argv._;

  if (!url) {
    throw new Error(
      `A URL or spec file must be provided to generate the API client`,
    );
  }

  const res = await fetch(url);

  console.info(chalk.gray(`OpenAPI specification loaded from ${url}`));

  return res.json();
};
