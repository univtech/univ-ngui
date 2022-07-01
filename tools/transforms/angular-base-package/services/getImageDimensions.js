const {join} = require('canonical-path');
const sizeOf = require('image-size');

/**
 * 获取图片大小
 *
 * @returns {function(*, *): void | ISizeCalculationResult}
 */
module.exports = function getImageDimensions() {
    return (basePath, path) => sizeOf(join(basePath, path));
};
