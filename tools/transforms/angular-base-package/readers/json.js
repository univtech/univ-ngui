/**
 * Read in JSON files
 */
module.exports = function jsonFileReader() {
    return {
        name: 'jsonFileReader',
        defaultPattern: /\.json$/,
        getDocs: function (fileInfo) {

            // We return a single element array because content files only contain one document
            return [{
                docType: 'json',
                data: JSON.parse(fileInfo.content),
                template: 'json.template.json',
                id: fileInfo.relativePath,
                aliases: [fileInfo.baseName, fileInfo.relativePath]
            }];
        }
    };
};
