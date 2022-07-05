const {extname, resolve} = require('canonical-path');
const {existsSync} = require('fs');
const path = require('path');

const Package = require('dgeni').Package;
const gitPackage = require('dgeni-packages/git');
const jsdocPackage = require('dgeni-packages/jsdoc');
const nunjucksPackage = require('dgeni-packages/nunjucks');
const postProcessPackage = require('dgeni-packages/post-process-html');

const remarkPackage = require('../remark-package');

const {
    PROJECT_ROOT,
    TEMPLATES_PATH,
    SRC_PATH,
    DOCS_OUTPUT_PATH,
    requireFolder,
} = require('../config');

module.exports = new Package('angular-base', [
    gitPackage, jsdocPackage, nunjucksPackage, remarkPackage, postProcessPackage
])

    // Register the processors
    .processor(require('./processors/generateKeywords'))
    .processor(require('./processors/createSitemap'))
    .processor(require('./processors/checkUnbalancedBackTicks'))
    .processor(require('./processors/convertToJson'))
    .processor(require('./processors/fixInternalDocumentLinks'))
    .processor(require('./processors/copyContentAssets'))
    .processor(require('./processors/renderLinkInfo'))
    .processor(require('./processors/checkContentRules'))
    .processor(require('./processors/splitDescription'))
    .processor(require('./processors/disambiguateDocPaths'))

    // overrides base packageInfo and returns the one for the 'angular/angular' repo.
    .factory('packageInfo', function () {
        return require(path.resolve(PROJECT_ROOT, 'package.json'));
    })
    .factory(require('./readers/json'))
    .factory(require('./services/copyFolder'))
    .factory(require('./services/getImageDimensions'))
    .factory(require('./services/getPreviousMajorVersions'))

    .factory(require('./post-processors/add-image-dimensions'))

    // Configure jsdoc-style tag parsing
    .config(function (inlineTagProcessor) {
        inlineTagProcessor.inlineTagDefinitions.push(require('./inline-tag-defs/custom-search-defs/'));
    })

    // Where do we get the source files?
    .config(function (readFilesProcessor, generateKeywordsProcessor, jsonFileReader) {

        readFilesProcessor.fileReaders.push(jsonFileReader);
        readFilesProcessor.basePath = PROJECT_ROOT;
        readFilesProcessor.sourceFiles = [];

        generateKeywordsProcessor.ignoreWords = require(path.resolve(__dirname, 'ignore-words'))['en'];
        generateKeywordsProcessor.docTypesToIgnore = [undefined, 'example-region', 'json-doc', 'api-list-data', 'api-list-data', 'contributors-json', 'navigation-json', 'announcements-json'];
        generateKeywordsProcessor.propertiesToIgnore = ['basePath', 'renderedContent', 'docType', 'searchTitle'];
    })

    // Where do we write the output files?
    .config(function (writeFilesProcessor) {
        writeFilesProcessor.outputFolder = DOCS_OUTPUT_PATH;
    })

    // Configure nunjucks rendering of docs via templates
    .config(function (
        renderDocsProcessor, templateFinder, templateEngine, getInjectables) {

        // Where to find the templates for the doc rendering
        templateFinder.templateFolders = [TEMPLATES_PATH];

        // Standard patterns for matching docs to templates
        templateFinder.templatePatterns = [
            '${ doc.template }',
            '${ doc.id }.${ doc.docType }.template.html',
            '${ doc.id }.template.html',
            '${ doc.docType }.template.html',
            '${ doc.id }.${ doc.docType }.template.json',
            '${ doc.id }.template.json',
            '${ doc.docType }.template.json',
        ];

        // Nunjucks and Angular conflict in their template bindings so change Nunjucks
        templateEngine.config.tags = {variableStart: '{$', variableEnd: '$}'};

        templateEngine.filters =
            templateEngine.filters.concat(getInjectables(requireFolder(__dirname, './rendering')));

        // helpers are made available to the nunjucks templates
        renderDocsProcessor.helpers.relativePath = function (from, to) {
            return path.relative(from, to);
        };
    })

/*
    .config(function (copyContentAssetsProcessor) {
        copyContentAssetsProcessor.assetMappings.push(
            {from: path.resolve(CONTENTS_PATH, '/!**!/images'), to: path.resolve(OUTPUT_PATH, '/!**!/images')}
        );
    })
*/

    .config(function (checkAnchorLinksProcessor) {
        // since we encode the HTML to JSON we need to ensure that this processor runs before that encoding happens.
        checkAnchorLinksProcessor.$runBefore = ['convertToJsonProcessor'];
        checkAnchorLinksProcessor.$runAfter = ['fixInternalDocumentLinks'];
        // We only want to check docs that are going to be output as JSON docs.
        checkAnchorLinksProcessor.checkDoc = (doc) => doc.path && doc.outputPath && extname(doc.outputPath) === '.json' && doc.docType !== 'json-doc';
        // Since we have a `base[href="/"]` arrangement all links are relative to that and not relative to the source document's path
        checkAnchorLinksProcessor.base = '/';
        // Ignore links to local assets
        // (This is not optimal in terms of performance without making changes to dgeni-packages there is no other way.
        //  That being said do this only add 500ms onto the ~30sec doc-gen run - so not a huge issue)
        checkAnchorLinksProcessor.ignoredLinks.push({
            test(url) {
                return (existsSync(resolve(SRC_PATH, url)));
            }
        });
        checkAnchorLinksProcessor.pathVariants = ['', '/', '.html', '/index.html', '#top-of-page'];
        checkAnchorLinksProcessor.errorOnUnmatchedLinks = true;
    })

    .config(function (computePathsProcessor, generateKeywordsProcessor) {

        generateKeywordsProcessor.outputFolder = 'app';

        // Replace any path templates inherited from other packages
        // (we want full and transparent control)
        computePathsProcessor.pathTemplates = [
            {
                docTypes: ['example-region'], getOutputPath: function () {
                }
            },
        ];
    })


    .config(function (postProcessHtml, addImageDimensions) {
        addImageDimensions.basePath = path.resolve(PROJECT_ROOT, 'src');
        postProcessHtml.plugins = [
            require('./post-processors/autolink-headings'),
            addImageDimensions,
            require('./post-processors/h1-checker'),
        ];
    })

    .config(function (convertToJsonProcessor) {
        convertToJsonProcessor.docTypes = [];
    });
