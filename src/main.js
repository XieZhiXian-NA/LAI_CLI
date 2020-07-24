// 1. 解析用户的命令行参数
// 参数都存放在 process.argv下
const program = require('commander');
// 解析用户的参数
const path = require('path');
const { version } = require('../constants');

const mapActions = {
  create: {
    alias: 'c',
    description: 'create a project',
    examples: [
      'lai-cli create <project-name>',
    ],
  },
  config: {
    alias: 'conf',
    description: 'config project variable',
    examples: [
      'lai-cli config set <k> <v>',
      'lai-cli config get <k>',
    ],
  },
  '*': {
    alias: '',
    description: 'command not found',
    examples: [],
  },
};
// object.keys  reflect支持symbol
Reflect.ownKeys(mapActions).forEach((action) => {
  program.command(action)
    .alias(mapActions[action].alias)
    .description(mapActions[action].description)
    .action(() => {
      if (action === '*') {
        console.log(mapActions[action].description);
      } else {
        console.log(action);
        require(path.resolve(__dirname, action))(...process.argv.slice(3));
      }
    });
});

// 监听--help事件
program.on('--help', () => {
  console.log('\nExamples:');
  Reflect.ownKeys(mapActions).forEach((action) => {
    mapActions[action].examples.forEach((example) => {
      console.log(` ${example}`);
    });
  });
});

program.version(version).parse(process.argv);
// 配置给用户的一些参数
