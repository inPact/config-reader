const _ = require('lodash');
const fs = require('fs');
const extra = require('fs-extra');
const should = require('chai').should();

describe('read should: ', function () {
    afterEach(function () {
        tryClearModuleCache('../src/index');
        tryClearModuleCache('../temp/default.js');
        tryClearModuleCache('../temp/current.js');
        extra.removeSync('./temp');
    })

    it('silently ignore non-existent paths', async function () {
        let reader = require('../src/index');
        let config = reader.read();
        config.should.include({});
    });

    it('merge default config sections with current config sections', async function () {
        fs.mkdirSync('./temp');
        fs.writeFileSync('./temp/default.js', `module.exports = {section:{x:1,y:2}}`);
        fs.writeFileSync('./temp/current.js', `module.exports = {section:{a:3}}`);

        let reader = require('../src/index');
        let config = reader.read({ env: 'current', dirPath: '../temp', defaultConfigPath: '../temp/default.js' });

        should.equal(_.get(config, 'section.x'), 1);
        should.equal(_.get(config, 'section.y'), 2);
        should.equal(_.get(config, 'section.a'), 3);
    });

    it('overwrite default config sections with current config "override" sections', async function () {
        fs.mkdirSync('./temp');
        fs.writeFileSync('./temp/default.js', `module.exports = {section:{x:1,y:2}}`);
        fs.writeFileSync('./temp/current.js', `module.exports = {section:{a:3, __override:true}}`);

        let reader = require('../src/index');
        let config = reader.read({ env: 'current', dirPath: '../temp', defaultConfigPath: '../temp/default.js' });

        should.equal(_.get(config, 'section.a'), 3);
        should.not.exist(_.get(config, 'section.x'));
        should.not.exist(_.get(config, 'section.y'));
    });

    it('overwrite entries from environment variables using colon overwrite-syntax and parse numbers and floats', async function () {
        try {
            fs.mkdirSync('./temp');
            fs.writeFileSync('./temp/default.js', `module.exports = {section:{x:1,y:2,q:3,r:4}}`);

            process.env['section.y:'] = '55';
            process.env['section.q:'] = 44;
            process.env['section.r:'] = '33.33';
            let reader = require('../src/index');
            let config = reader.read({ env: 'current', dirPath: '../temp', defaultConfigPath: '../temp/default.js' });

            should.equal(_.get(config, 'section.y'), 55);
            should.equal(_.get(config, 'section.q'), 44);
            should.equal(_.get(config, 'section.r'), 33.33);
        } finally {
            delete process.env['section.y:'];
            delete process.env['section.q:'];
            delete process.env['section.r:'];
        }
    });

    it('overwrite entries from environment variables using colonless overwrite-syntax', async function () {
        try {
            fs.mkdirSync('./temp');
            fs.writeFileSync('./temp/default.js', `module.exports = {section:{x:1,y:2}}`);

            process.env['section.y.'] = 99;
            let reader = require('../src/index');
            let config = reader.read({ env: 'current', dirPath: '../temp', defaultConfigPath: '../temp/default.js' });

            should.equal(_.get(config, 'section.y'), 99);
        } finally {
            delete process.env['section.y.'];
        }
    });

    it('overwrite with array', async function () {
        fs.mkdirSync('./temp');
        fs.writeFileSync('./temp/default.js', `module.exports = {section:{x:1,y:2}}`);

        process.env['section.y.'] = '[1,2,3]';
        let reader = require('../src/index');
        let config = reader.read({ env: 'current', dirPath: '../temp', defaultConfigPath: '../temp/default.js' });

        _.get(config, 'section.y').should.deep.equal([1, 2, 3]);
    });
});

function tryClearModuleCache(modulePath) {
    try {
        delete require.cache[require.resolve(modulePath)]
    } catch (e) {
        console.log(`======================================= module to clear "${modulePath}" not found =======================================`);
    }
}