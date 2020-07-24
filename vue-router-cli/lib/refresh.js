const fs = require('fs');
const handlebars = require('handlebars');
const chalk = require('chalk');

// 通过数据，将模板渲染出来
/**
   * @param meta 数据定义
   * @param filepath 目标文件路径
   * @param templatePath 模板文件路径
   */
function compile(meta, filepath, templatePath) {
  // 模板存在才渲染
  if (fs.existsSync(templatePath)) {
    const content = fs.readFileSync(templatePath).toString();
    const result = handlebars.compile(content)(meta);
    fs.writeFileSync(filepath, result);
  }
  console.log(chalk.green(`火箭${filepath} 创建成功`));
}

module.exports = async () => {
  // 获取views列表
  const list = fs.readdirSync('./src/views')
    .filter((v) => v !== 'Home.vue')
    .map((p) => (
      { name: p.replace('.vue', '').toLowerCase(), file: p }
    ));
  // 生成路由
  compile({ list }, './src/router.js', './template/router.js.hbs');
  // 生成菜单
  compile({ list }, './src/App.vue', './template/App.vue.hbs');
};
