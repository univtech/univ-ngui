const Package = require('dgeni').Package;

const basePackage = require('../angular-base-package');
const contentPackage = require('../content-package');

const {CONTENTS_PATH} = require('../config');

module.exports = new Package('angular-content', [basePackage, contentPackage])

    // 获取源文件
    .config(function (readFilesProcessor) {
        readFilesProcessor.sourceFiles = readFilesProcessor.sourceFiles.concat([
            {
                basePath: CONTENTS_PATH,
                include: CONTENTS_PATH + '/**/*.md',
                fileReader: 'contentFileReader'
            },
            {
                basePath: CONTENTS_PATH,
                include: CONTENTS_PATH + '/**/*.json',
                fileReader: 'jsonFileReader'
            }
        ]);
    })

    .config(function (computePathsProcessor) {

        // Replace any path templates inherited from other packages
        // (we want full and transparent control)
        computePathsProcessor.pathTemplates = computePathsProcessor.pathTemplates.concat([
            {
                docTypes: ['content'],
                getPath: (doc) => `${doc.id.replace(/\/index$/, '')}`,
                outputPathTemplate: '${path}.json'
            },
            {docTypes: ['导航-json'], pathTemplate: '${id}', outputPathTemplate: '../${id}.json'}
        ]);
    })

    // We want the content files to be converted
    .config(function (convertToJsonProcessor, postProcessHtml) {
        convertToJsonProcessor.docTypes.push('content');
        postProcessHtml.docTypes.push('content');
    });
