/**
 * autoLinkCode后处理器使用这个服务来忽略URL中的http或https
 *
 * @returns {function(*, *, *): *[]|*}
 */
module.exports = function ignoreHttpInUrls() {
    const ignoredSchemes = ['http', 'https'];
    return (docs, words, index) => {
        const httpInUrl = ignoredSchemes.includes(words[index]) && (words[index + 1] === '://');
        return httpInUrl ? [] : docs;
    };
};
