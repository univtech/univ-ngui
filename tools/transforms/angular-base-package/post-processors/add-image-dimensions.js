const visit = require('unist-util-visit');
const is = require('hast-util-is-element');
const source = require('unist-util-source');

/**
 * img标签中没有定义width和height属性时，根据图片的大小给img标签添加width和height属性。
 *
 * @param getImageDimensions 获取图片大小的服务
 * @returns {function(): function(*, *): void}
 */
module.exports = function addImageDimensions(getImageDimensions) {
    return function addImageDimensionsImpl() {
        return (ast, file) => {
            visit(ast, node => {
                if (!is(node, 'img')) {
                    return;
                }

                const props = node.properties;
                const src = props.src;
                if (!src) {
                    file.message('img标签中没有src属性：`' + source(node, file) + '`');
                    return;
                }

                try {
                    const dimensions = getImageDimensions(addImageDimensionsImpl.basePath, src);
                    if (props.width === undefined && props.height === undefined) {
                        props.width = '' + dimensions.width;
                        props.height = '' + dimensions.height;
                    }
                } catch (e) {
                    if (e.code === 'ENOENT') {
                        file.fail('无法加载img标签的src属性指定的图片：`' + source(node, file) + '`');
                    } else {
                        file.fail(e.message);
                    }
                }
            });
        };
    };
};
