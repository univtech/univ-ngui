/**
 * autoLinkCode后处理器使用这个服务来过滤匹配单词是管道名称并且前面没有管道的管道文档
 *
 * @returns {function(*, *, *): *}
 */
module.exports = function filterPipes() {
    return (docs, words, index) =>
        docs.filter(doc =>
            doc.docType !== 'pipe' ||
            doc.pipeOptions.name !== '\'' + words[index] + '\'' ||
            index === 0 ||
            words[index - 1].trim() === '|');
};
