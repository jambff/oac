const esmRequire = require('esm')(module);

const { build } = esmRequire('./build.js');

(async () => {
  try {
    await build();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
