const {copySync} = require('fs-extra');

/**
 * 复制目录
 *
 * @returns {function(*, *): *|void}
 */
module.exports = function copyFolder() {
    return (from, to) => copySync(from, to);
};
