const path = require('path');
const fse = require('fs-extra');
const yargs = require('yargs');
const fetch = require('node-fetch');
const { hideBin } = require('yargs/helpers');

const { argv } = yargs(hideBin(process.argv));

module.exports.getSpecFromFile = async (partialSpecPath) => {
  const specPath = path.isAbsolute(partialSpecPath)
    ? partialSpecPath
    : path.join(process.cwd(), partialSpecPath);

  if (!fse.existsSync(specPath)) {
    throw new Error(`No spec found at ${specPath}`);
  }

  return fse.readJSONSync(specPath);
};

/**
 * Generate all the things.
 */
module.exports.getOapiSpec = async () => {
  if (argv.f) {
    return this.getSpecFromFile(argv.f);
  }

  if (!argv._) {
    throw new Error(`A URL or spec file must be provided`);
  }

  const res = await fetch(argv._);

  return res.json();
};
