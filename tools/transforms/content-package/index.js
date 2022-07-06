var Package = require('dgeni').Package;

module.exports = new Package('content')

    // 注册文件读取器
    .factory(require('./readers/content'))

    .config(function (readFilesProcessor, contentFileReader) {
        // 配置readFilesProcessor
        readFilesProcessor.fileReaders.push(contentFileReader);
    })

    .config(function (computeIdsProcessor) {
        // 配置computeIdsProcessor
        computeIdsProcessor.idTemplates.push({
            docTypes: ['content'],
            getId: function (doc) {
                return doc.fileInfo
                    .relativePath
                    // path should be relative to `modules` folder
                    .replace(/.*\/?modules\//, '')
                    // path should not include `/docs/`
                    .replace(/\/docs\//, '/')
                    // path should not have a suffix
                    .replace(/\.\w*$/, '');
            },
            getAliases: function (doc) {
                return [doc.id];
            }
        });
    });
