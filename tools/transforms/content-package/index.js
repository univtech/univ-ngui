var Package = require('dgeni').Package;
var jsdocPackage = require('dgeni-packages/jsdoc');

var linksPackage = require('../links-package');
var {requireFolder} = require('../config');

module.exports = new Package('content', [jsdocPackage, linksPackage])

    // 注册文件读取器
    .factory(require('./readers/content'))

    // 配置文件读取器
    .config(function (readFilesProcessor, contentFileReader) {
        readFilesProcessor.fileReaders.push(contentFileReader);
    })

    .config(function (parseTagsProcessor, getInjectables) {
        parseTagsProcessor.tagDefinitions = parseTagsProcessor.tagDefinitions.concat(
            getInjectables(requireFolder(__dirname, './tag-defs')));
    })

    // Configure ids and paths
    .config(function (computeIdsProcessor) {
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
