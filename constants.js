// 存放用户需要的常量
const { version } = require('./package.json');
// 下载模板存放的目录 缓存目录 放到用户C:\Users\Administrator\template文件中
// 隐藏的文件 防止用户删除
const downloadDirectory = `${process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME']}/.template`;

module.exports = {
  version,
  downloadDirectory,
};
