/**
 * autoLinkCode后处理器使用这个服务来过滤匹配单词是指令选择器时的不明确指令文档
 *
 * @returns {(function(*, *, *): (*))|*}
 */
module.exports = function filterAmbiguousDirectiveAliases() {
    return (docs, words, index) => {
        const word = words[index];

        // 只处理存在多个匹配文档的情况
        if (docs.length > 1) {
            // 只处理指令或组件的选择器中包含匹配单词的情况
            if (docs.every(doc => (doc.docType === 'directive' || doc.docType === 'component') && (doc[doc.docType + 'Options'].selector.indexOf(word) != -1))) {
                // 查找类名与单词匹配的指令，不区分大小写
                return docs.filter(doc => doc.name.toLowerCase() === word.toLowerCase());
            }
        }
        return docs;
    };
};
