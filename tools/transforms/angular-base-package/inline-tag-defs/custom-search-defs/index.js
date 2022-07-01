module.exports = {
    name: 'searchKeywords',
    description: '使用检索词创建元素的缩写。用法：`{@searchKeywords term1 term2 termN }`',
    handler: function (doc, tagName, tagDescription) {
        doc.searchKeywords = tagDescription;
        return '';
    }
};
