const path = require('path');
const fse = require('fs-extra');

/**
 * Write a file.
 */
module.exports.writeFile = async (outPath, content) => {
  fse.ensureDirSync(path.dirname(outPath));

  return fse.writeFile(outPath, content);
};
