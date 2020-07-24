const { promisify } = require('util');
const download = promisify(require('download-git-repo'));
const ora = require('ora');

module.exports.clone = async (repo, desc) => {
  // repo 下载的地址 desc下载的地址
  const process = ora(`download ... ${repo}`);
  process.start();
  await download(repo, desc);
  process.succeed();
};
