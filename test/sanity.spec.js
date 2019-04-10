const _ = require('lodash');
const fs = require('fs');
const extra = require('fs-extra');
const should = require('chai').should();

describe('read should: ', function () {
    it('silently ignore non-existent paths', async function () {
        let reader = require('../src/index');
        let config = reader.read();
        config.should.include({});
    });

    it('merge default config sections with current config sections', async function () {
        try {
            fs.mkdirSync('./temp1');
            fs.writeFileSync('./temp1/default.js', `module.exports = {section:{x:1,y:2}}`);
            fs.writeFileSync('./temp1/current.js', `module.exports = {section:{a:3}}`);

            let reader = require('../src/index');
            let config = reader.read({ env: 'current', dirPath: '../temp1', defaultConfigPath: '../temp1/default.js' });

            should.equal(_.get(config, 'section.x'), 1);
            should.equal(_.get(config, 'section.y'), 2);
            should.equal(_.get(config, 'section.a'), 3);
        } finally {
            extra.removeSync('./temp1');
        }
    });

    it('overwrite default config sections with current config "override" sections', async function () {
        try {
            fs.mkdirSync('./temp2');
            fs.writeFileSync('./temp2/default.js', `module.exports = {section:{x:1,y:2}}`);
            fs.writeFileSync('./temp2/current.js', `module.exports = {section:{a:3, __override:true}}`);

            let reader = require('../src/index');
            let config = reader.read({ env: 'current', dirPath: '../temp2', defaultConfigPath: '../temp2/default.js' });

            should.equal(_.get(config, 'section.a'), 3);
            should.not.exist(_.get(config, 'section.x'));
            should.not.exist(_.get(config, 'section.y'));
        } finally {
            extra.removeSync('./temp2');
        }
    });
});
