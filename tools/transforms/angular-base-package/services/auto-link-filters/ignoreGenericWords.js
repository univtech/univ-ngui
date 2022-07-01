/**
 * autoLinkCode后处理器使用这个服务来忽略那些可能会被误认为类或函数的通用单词
 *
 * @returns {function(*, *, *): *[]|*}
 */
module.exports = function ignoreGenericWords() {
    const ignoredWords = new Set([
        'a',
        'classes',
        'create',
        'error',
        'group',
        'json',
        'number',
        'request',
        'state',
        'target',
        'value',
        '_'
    ]);
    return (docs, words, index) => ignoredWords.has(words[index].toLowerCase()) ? [] : docs;
};
