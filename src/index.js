const _ = require('lodash');
const floatRegex = /^\d+\.?\d*$/;
const pathOverrideRegex = /[:.]$/;
const jsonRegex = /^"?{.*}"?$|^"?\[.*\]"?$/;
const path = require('path');

function requireOptionalModule(path) {
    try {
        return require(path);
    } catch (e) {
        return {};
    }
}

module.exports = {
    get env() {
        return process.env.NODE_ENV === 'test'
            ? process.env.TEST_ENV || process.env.NODE_ENV
            : process.env.NODE_ENV || 'local';
    },

    read({ env, dirPath = '', defaultConfigPath = '' } = {}) {
        env = env || this.env;
        let defaultConfig = requireOptionalModule(defaultConfigPath);
        let envConfig = requireOptionalModule(path.join(dirPath, env));

        let config = _.mergeWith(defaultConfig, envConfig,
            (a, b) => {
                if (b && b.__override)
                    return b;
            });

        applyPathConfig(config, process.env);
        return config;
    }
};

function applyPathConfig(cnfg, env) {
    _.forOwn(env, (val, key) => {
        key = key.trim();
        if (!pathOverrideRegex.test(key) || !val)
            return;

        if (jsonRegex.test(val.trim()))
            val = JSON.parse(val);

        else if (floatRegex.test(val))
            val = parseFloat(val);

        else if (['true', 'false'].some(v => v === val))
            val = val === 'true';

        else if (val === 'null')
            val = null;

        else
            val = _.trim(val, '"');

        let path = _.replace(key, pathOverrideRegex, '');
        _.set(cnfg, path, val);
    });
}
