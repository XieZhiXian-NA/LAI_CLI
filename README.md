### cli之模板渲染

+ commander:参数解析 

+ inquire:交互式命令行工具，命令行的选择工具 选择哪一项

```js
1. 获取所有的repo 选择一个
  const { repo } = await Inquirer.prompt({
    name: 'repo', // 获取选择后的结果就是repo与变量名要一致
    type: 'list',
    message: 'please choise a template to create project',
    choices: repos,
  });

2. 获取repo的tag 选择一个
  tags = tags.map((tag) => tag.name);
  const { tag } = await Inquirer.prompt({
    name: 'tag', // 获取选择后的结果就是repo
    type: 'list',
    message: 'please choise a tag to create project',
    choices: tags,
  });

使用github提供的api 拿到repos tags
// 获取仓库列表
const fetchRepoList = async () => {
  const { data } = await axios.get('https://api.github.com/orgs/组织名/repos');
  return data;
};

// 获取对应的版本号
const fetchTagList = async (repo) => {
  const { data } = await axios.get(`https://api.github.com/repos/组织名/${repo}/tags`);
  return data;
};

```

+ download-git-repo:在git中下载模板

  ```js
  const download = async (repo, tag) => {
    let api = `组织名/${repo}`; // 组织 模板名 下载路径
    if (tag) api += `#${tag}`;
    const dist = `${downloadDirectory}/${repo}`; 下载后存放的路径
    await downloadGitRepo(api, dist);
    return dist;
  };
  ```

+ chalk:粉笔在控制台中画出各种各样的颜色

+ metalsmith:读取该目录下的所有文件资源

```js
链式调用不能直接promisify
经过metalSmith读取后文件时二进制 模板渲染只能渲染字符串
let content = files[file].contents.toString();
模板渲染后再转为buffer
files[file].contents = Buffer.from(content);

Metalsmith works in three simple steps:

Read all the files in a source directory.
Invoke a series of plugins that manipulate the files.
Write the results to a destination directory!
    
metalsmith 链式调用use 注册中间件 使用build执行中间件
.use((files,meta,done))  files 遍历目录下的所有文件，meta在多个中间件之间传值，done该中间件完成了    
await new Promise((resolve,reject)=>{
   MetalSmith(__dirname)    // 传入文件路径，会默认查找路径下的src目录
     .source(result)       // 指定查找的文件的范围，不仅仅是查找src目录
     .destination(desti)  // 渲染后要去的文件目录 
      .use(async (files, metal, done) => { // metal.metadata();在多个中间件之间传值
          done(); //调用done 触发下一个中间件
          })
      .use(async (files, metal, done) => {
          done();
         })
       .build((err) => { // 等待中间件执行完毕后的回调函数fn(err,data)
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
})

```

+ consolidate:统一了所有模板的render渲染函数，如使用ejs，还需要额外的安装ejs

+ bin:可运行的脚本

+ ora:loading

  ```js
  // 封装loading
  const waitFnloading = (fn, message) => async (...args) => {
    const spinner = ora(message);
    spinner.start(); // 开始loading
    const result = await fn(...args);
    spinner.succeed(); // 完成后显示钩
    return result;
  };
  ```

```js
promisify源码实现

consolidate的模板渲染函数render 渲染成功以后会返回渲染后的模板
render(准备渲染的模板，渲染的数据，function(err,data))

let promisify = (fn)=>(...args)=>new Promise((resolve,reject)=>{
    args.push(function(err,...arg){
        if(err) reject(err)
        else resolve(...arg)
    })
    fn.apply(null,args)
9})
```

+ npm install 

  ```js
  开启一个异步子线程 去调用shell 执行 npm install
  child_process.spawn 会返回一个带有stdout与stderr流的对象 读取子进程返回给node的数据
  
  child_process.spawn(command, args, options)
  
  // 在下载的目录下执行cnpm install方法
  await spawn('cnpm', ['install'], { cwd: `./${name}` ,shell:process.plateform === 'win32'});
  
   // proc.stdout.pipe(chalk.green(process.stdout));
   // proc.stderr.pipe(chalk.red(process.stderr));
   proc.stdout.on('data', (data) => { //监听标准输出
        process.stdout.write(chalk.green(data));
    });
   proc.stderr.on('data', (data) => { // 监听标准错误输出
        process.stderr.write(chalk.yellow(data));
      });
   proc.on('close', () => { //子进程退出
        resolve();
      });// 执行完成
  proc.on('error',(err)=>{
      reject(err) //创建子进程错误
  })
  ```
  
+ 执行run

 ```js
  open('http://localhost:8080');
    await spawns('npm', ['run', 'serve'], { cwd: `./${name}`, shell: process.platform === 'win32' });
 ```

+ 热更新

  ```js
  watch 
  检测.src目录下的文件  当文件发生了更改 重新执行npm run serve方法
  module.exports = async ()=>{
      const watch = require('watch')
      let process //监听的子进程
      let isRefresh = false 节流
      watch.watchTree('./src', async (f) => {
          if(!isRefresh){
              isRefresh = true
              process && process.kill()
              await require('./refresh')() //执行路由和菜单的生成
              setTimeout(()={isRefresh = false},5000) // 5s之内文件再次更改才再次执行文件
              process = spawn('npm', ['run', 'serve']);
          }
      }
  }
  ```

  