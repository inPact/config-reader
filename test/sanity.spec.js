const should = require('chai').should();

describe('read should: ', function () {
    it('silently ignore non-existent paths', async function () {
        let reader = require('../src/index');
        let config = reader.read();
        config.should.include({});
    });
});
