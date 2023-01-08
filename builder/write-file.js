import path from 'path';
import fse from 'fs-extra';

/**
 * Write a file.
 */
export const writeFile = async (outPath, content) => {
  fse.ensureDirSync(path.dirname(outPath));

  return fse.writeFile(outPath, content);
};
