const path = require('path');
const { SRC_DIR, TEMPLATES_DIR } = require('./constants');
const { version } = require('../package.json');

const { compileTemplate } = require('./compile-template');

/**
 * Build a file that defines the API client version.
 *
 * This is run as part of the build process and also just before publishing to
 * npm, so that the client can identify itself with the current package version,
 * without us needing to import the package.json directly into source code, which
 * causes various issues.
 */
module.exports.buildVersionFile = async () => {
  const fileName = 'version.ts';
  const templatePath = path.join(TEMPLATES_DIR, `${fileName}.tmpl`);
  const outPath = path.join(SRC_DIR, fileName);

  await compileTemplate(templatePath, outPath, { version });
};
