'use strict';

/**
 * 处理器：generateKeywordsProcessor
 *
 * 该处理器从每个文档提取所有关键字，并创建一个新文档，该文档将作为包含所有这些数据的JavaScript文件呈现。
 *
 *
 * 从每个文档提取关键字，
 *
 * and creates a new document that will be rendered as a JavaScript file containing all this data.
 */
module.exports = function generateKeywordsProcessor(log) {
    return {
        ignoreWords: [],      // 忽略单词
        ignoreProperties: [], // 忽略属性
        ignoreDocTypes: [],   // 忽略文档类型
        outputFolder: '',     // 输出目录
        $validate: {
            ignoreWords: {},
            ignoreProperties: {},
            ignoreDocTypes: {},
            outputFolder: {presence: true}
        },
        $runAfter: ['postProcessHtml'],
        $runBefore: ['writing-files'],
        async $process(docs) {
            const {stemmer: stem} = await import('stemmer');
            const dictionary = new Map();
            const emptySet = new Set();

            const ignoreWords = new Set(this.ignoreWords);
            log.debug('忽略单词：', ignoreWords);
            const ignoreProperties = new Set(this.ignoreProperties);
            log.debug('忽略属性：', ignoreProperties);
            const ignoreDocTypes = new Set(this.ignoreDocTypes);
            log.debug('忽略文档类型：', ignoreDocTypes);

            // 过滤掉忽略文档类型，过滤掉内部或私有文档
            const filteredDocs = docs.filter(doc => !ignoreDocTypes.has(doc.docType)).filter(doc => !doc.internal && !doc.privateExport);

            for (const doc of filteredDocs) {
                // 从属性值中提取关键字
                let mainTokens = [];
                for (const key of Object.keys(doc)) {
                    const value = doc[key];
                    if (isString(value) && !ignoreProperties.has(key)) {
                        mainTokens.push(...tokenize(value, ignoreWords, dictionary));
                    }
                }

                // 从成员中提取关键词
                const memberTokens = extractMemberTokens(doc, dictionary);

                // 从标题中提取关键词
                let headingTokens = [];
                if (doc.vFile && doc.vFile.headings) {
                    for (const headingTag of Object.keys(doc.vFile.headings)) {
                        for (const headingText of doc.vFile.headings[headingTag]) {
                            headingTokens.push(...tokenize(headingText, ignoreWords, dictionary));
                        }
                    }
                }

                // 提取检索中使用的标题
                doc.searchTitle = doc.searchTitle || doc.title || doc.vFile && doc.vFile.title || doc.name || '';

                // 把检索数据添加到文档中
                doc.searchTerms = {};
                if (mainTokens.length > 0) {
                    doc.searchTerms.keywords = mainTokens;
                }
                if (memberTokens.length > 0) {
                    doc.searchTerms.members = memberTokens;
                }
                if (headingTokens.length > 0) {
                    doc.searchTerms.headings = headingTokens;
                }
                if (doc.searchKeywords) {
                    doc.searchTerms.topics = doc.searchKeywords.trim();
                }
            }

            // Now process all the search data and collect it up to be used in creating a new document
            const searchData = {
                dictionary: Array.from(dictionary.keys()).join(' '),
                pages: filteredDocs.map(page => {
                    // Copy the properties from the searchTerms object onto the search data object
                    const searchObj = {
                        path: page.path,
                        title: page.searchTitle,
                        type: page.docType,
                    };
                    if (page.deprecated) {
                        searchObj.deprecated = true;
                    }
                    return Object.assign(searchObj, page.searchTerms);
                }),
            };

            docs.push({
                docType: 'json-doc',
                id: 'search-data-json',
                path: this.outputFolder + '/search-data.json',
                outputPath: this.outputFolder + '/search-data.json',
                data: searchData,
                renderedContent: JSON.stringify(searchData)
            });

            return docs;

            // Helpers
            function tokenize(text, ignoreWords, dictionary) {
                // Split on whitespace and things that are likely to be HTML tags (this is not exhaustive but reduces the unwanted tokens that are indexed).
                const rawTokens = text.split(new RegExp(
                    '[\\s/]+' +                                // whitespace
                    '|' +                                      // or
                    '</?[a-z]+(?:\\s+\\w+(?:="[^"]+")?)*/?>',  // simple HTML tags (e.g. <td>, <hr/>, </table>, etc.)
                    'ig'));
                const tokens = [];
                for (let token of rawTokens) {
                    token = token.trim();

                    // Trim unwanted trivia characters from the start and end of the token
                    const TRIVIA_CHARS = '[\\s_"\'`({[<$*)}\\]>.,-]';
                    // Tokens can contain letters, numbers, underscore, dot or hyphen but not at the start or end.
                    // The leading TRIVIA_CHARS will capture any leading `.`, '-`' or `_` so we don't have to avoid them in this regular expression.
                    // But we do need to ensure we don't capture the at the end of the token.
                    const POSSIBLE_TOKEN = '[a-z0-9_.-]*[a-z0-9]';
                    token = token.replace(new RegExp(`^${TRIVIA_CHARS}*(${POSSIBLE_TOKEN})${TRIVIA_CHARS}*$`, 'i'), '$1');

                    // Skip if blank or in the ignored words list
                    if (token === '' || ignoreWords.has(token.toLowerCase())) {
                        continue;
                    }

                    // Skip tokens that contain weird characters
                    if (!/^\w[\w.-]*$/.test(token)) {
                        continue;
                    }

                    storeToken(token, tokens, dictionary);
                    if (token.startsWith('ng')) {
                        // Strip off `ng`, `ng-`, `ng1`, `ng2`, etc
                        storeToken(token.replace(/^ng[-12]*/, ''), tokens, dictionary);
                    }
                }

                return tokens;
            }

            function storeToken(token, tokens, dictionary) {
                token = stem(token);
                if (!dictionary.has(token)) {
                    dictionary.set(token, dictionary.size);
                }
                tokens.push(dictionary.get(token));
            }

            function extractMemberTokens(doc, dictionary) {
                if (!doc) return [];

                let memberContent = [];

                if (doc.members) {
                    doc.members.forEach(member => memberContent.push(...tokenize(member.name, emptySet, dictionary)));
                }
                if (doc.statics) {
                    doc.statics.forEach(member => memberContent.push(...tokenize(member.name, emptySet, dictionary)));
                }
                if (doc.extendsClauses) {
                    doc.extendsClauses.forEach(clause => memberContent.push(...extractMemberTokens(clause.doc, dictionary)));
                }
                if (doc.implementsClauses) {
                    doc.implementsClauses.forEach(clause => memberContent.push(...extractMemberTokens(clause.doc, dictionary)));
                }

                return memberContent;
            }
        }
    };
};

function isString(value) {
    return typeof value == 'string';
}
