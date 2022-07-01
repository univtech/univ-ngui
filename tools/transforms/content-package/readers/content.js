/**
 * content文件读取器：读取*.md文件的内容。<br>
 * doc初始格式为：
 * ```
 * {
 *   content: '文件内容',
 *   startingLine: 1
 * }
 * ```
 */
module.exports = function contentFileReader() {
    return {
        name: 'contentFileReader',
        defaultPattern: /\.md$/,
        getDocs: function (fileInfo) {
            return [{docType: 'content', content: fileInfo.content}];
        }
    };
};
