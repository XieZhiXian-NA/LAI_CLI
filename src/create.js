const axios = require('axios');
const ora = require('ora');
const Inquirer = require('inquirer');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
// 遍历文件夹 查找需要渲染的模板文件
const MetalSmith = require('metalsmith');
// 统一了所有的模板引擎 渲染ejs模板
let { render } = require('consolidate').ejs;

render = promisify(render);
// 需要将download转为promise函数
let downloadGitRepo = require('download-git-repo');
let ncp = require('ncp');
const { downloadDirectory } = require('../constants');

ncp = promisify(ncp);

downloadGitRepo = promisify(downloadGitRepo);
// 获取仓库列表
const fetchRepoList = async () => {
  const { data } = await axios.get('https://api.github.com/orgs/zhu-cli/repos');
  return data;
};

// 获取对应的版本号
const fetchTagList = async (repo) => {
  const { data } = await axios.get(`https://api.github.com/repos/zhu-cli/${repo}/tags`);
  return data;
};

const download = async (repo, tag) => {
  let api = `zhu-cli/${repo}`; // 组织 模板名 下载路径
  if (tag) api += `#${tag}`;
  const dist = `${downloadDirectory}/${repo}`;
  await downloadGitRepo(api, dist);
  return dist;
};

// 封装loading
// 获取之前显示loading  获取后选择哪一个模板
const waitFnloading = (fn, message) => async (...args) => {
  const spinner = ora(message);
  spinner.start(); // 开始loading
  const result = await fn(...args);
  spinner.succeed(); // 完成后显示钩
  return result;
};
module.exports = async (projectName) => {
  // 获取项目的所有模板名字
  let repos = await waitFnloading(fetchRepoList, 'fetching template ...')();
  repos = repos.map((repo) => repo.name);
  console.log(repos);
  const { repo } = await Inquirer.prompt({
    name: 'repo', // 获取选择后的结果就是repo
    type: 'list',
    message: 'please choise a template to create project',
    choices: repos,
  });
  // 获取模板的tag
  let tags = await waitFnloading(fetchTagList, 'fetching tag ...')(repo);
  tags = tags.map((tag) => tag.name);
  const { tag } = await Inquirer.prompt({
    name: 'tag', // 获取选择后的结果就是repo
    type: 'list',
    message: 'please choise a tag to create project',
    choices: tags,
  });
  // 下载模板 放到一个零时的目录--临时缓存 下载过了就不再重新下载
  const result = await waitFnloading(download, 'download template ...')(repo, tag);

  // 拿到下载的目录 直接拿到当前执行的目录下 ncp拷贝
  // 将下载template的内容拷贝到 自己创建的目录文件下
  // 若该项目已经存在 提示重复

  const exit = fs.existsSync(path.join(result, 'ask.js'));
  const desti = path.resolve(projectName);
  if (!exit) {
    await ncp(result, desti);
  } else {
    // 1. 遍历ask.js 让用户填写信息 交互式的信息文件
    // 2. 填写的信息填入模板

    await new Promise((resolve, reject) => {
      MetalSmith(__dirname) // 传入文件路径，会默认查找路径下的src目录
        .source(result) // 指定查找的文件的范围，不仅仅是查找src目录
        .destination(desti) // 渲染后要去的文件目录
        .use(async (files, metal, done) => {
          // files 目录下的所有文件
          const args = require(path.join(result, 'ask.js'));
          const obj = await Inquirer.prompt(args);
          const meta = metal.metadata();
          Object.assign(meta, obj);
          delete files['ask.js'];
          done();
        })
        .use(async (files, metal, done) => {
          const obj = metal.metadata();
          Reflect.ownKeys(files).forEach(async (file) => {
            // 只查找js json文件
            if (file.includes('js') || file.includes('json')) {
              let content = files[file].contents.toString();
              if (content.includes('<%')) {
                content = await render(content, obj);
                files[file].contents = Buffer.from(content);
              }
            }
          });
          done();
        })
        .build((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
    });
  }

  // 复杂模板 解析模板 package.json 填入里面的作者 版本号等
  // 选择sass ts等 metalsmith实现读取文件
  //  如果有ask.js 就是一个复杂的模板
};
