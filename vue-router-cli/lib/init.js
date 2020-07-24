const { promisify } = require('util');
const figlet = promisify(require('figlet'));

const clear = require('clear'); // 清空命令行
const chalk = require('chalk');
const { spawn } = require('child_process');
const open = require('open');
const { clone } = require('./download');

const log = (content) => console.log(chalk.green(content));

function spawns(...args) {
  return new Promise((resolve) => {
    const proc = spawn(...args);
    // 子进程的输出流
    // proc.stdout.pipe(chalk.green(process.stdout));
    // proc.stderr.pipe(chalk.red(process.stderr));
    proc.stdout.on('data', (data) => {
      process.stdout.write(chalk.green(data));
    });
    proc.stderr.on('data', (data) => {
      process.stderr.write(chalk.yellow(data));
    });
    proc.on('close', () => {
      resolve();
    });// 执行完成
  });
}
module.exports = async (name) => {
  // 打印欢迎界面
  clear();
  const data = await figlet('LAI WELCOME');
  log(data);
  // 克隆项目
  await clone('github:su37josephxia/vue-template', name);

  // 安装依赖 在下载后的目录地址安装
  log('安装依赖');

  await spawns('cnpm', ['install'], { cwd: `./${name}`, shell: process.platform === 'win32' });
  log(`
   OK
   ===========
   安装ok
   
  `);

  // 启动项目 打开浏览器 open
  open('http://localhost:8080');
  await spawns('npm', ['run', 'serve'], { cwd: `./${name}`, shell: process.platform === 'win32' });
};
