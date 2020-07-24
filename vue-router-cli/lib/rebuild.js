const { promisify } = require('util');
let { render } = require('consolidate').handlebars;

const MetalSmith = require('metalsmith');

render = promisify(render);

module.exports = async () => {
  await new Promise((resolve, reject) => {
    MetalSmith('./')
      .source('./src')
      .use(async (files, metal, done) => {
        const resVue = [];
        Reflect.ownKeys(files).forEach((file) => {
          if (file.startsWith('views')) {
            const f = file.match(/\\(.*)/)[1];
            resVue.push({
              name: f.replace('.vue', '').toLowerCase(),
              file: f,
            });
          }
        });
        const obj = {
          or: resVue,
        };
        const meth = metal.metadata();
        Object.assign(meth, obj);
        done();
      })
      .use(async (files, metal, done) => {
        const { or } = metal.metadata();
        console.log(files, or);
        Reflect.ownKeys(files).forEach(async (file) => {
          if (file.includes('router.js.hbs')) {
            let content = files[file].contents.toString();

            content = await render(content, { or });
            console.log(content);
            files['router.js'].contents = Buffer.from(content);
          }
          if (file.includes('App.vue.hbs')) {
            let content = files[file].contents.toString();
            content = await render(content, { or });
            files['App.vue'].contents = Buffer.from(content);
          }
        });
        done();
      })
      .build((err) => {
        if (err) {
          reject(err);
        } else resolve();
      });
  });
};
