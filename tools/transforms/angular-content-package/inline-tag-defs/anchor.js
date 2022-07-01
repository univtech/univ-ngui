module.exports = {
    name: 'a',
    description: '创建标题链接的缩写。用法：`{@a some-id}`',
    handler: function (doc, tagName, tagDescription) {
        return '<a id="' + tagDescription.trim() + '"></a>';
    }
};
