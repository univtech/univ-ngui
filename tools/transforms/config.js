const {resolve} = require('path');
const {readdirSync} = require('fs');

const PROJECT_ROOT = resolve(__dirname, '../..');
const TEMPLATES_PATH = resolve(PROJECT_ROOT, 'tools/transforms/templates');
const CONTENTS_PATH = resolve(PROJECT_ROOT, 'content');
const SRC_PATH = resolve(PROJECT_ROOT, 'src');
const OUTPUT_PATH = resolve(SRC_PATH, 'generated');
const DOCS_OUTPUT_PATH = resolve(OUTPUT_PATH, 'docs');

function requireFolder(dirname, folderPath) {
    const absolutePath = resolve(dirname, folderPath);
    return readdirSync(absolutePath)
        .filter(p => !/[._]spec\.js$/.test(p))  // ignore spec files
        .map(p => require(resolve(absolutePath, p)));
}

module.exports = {
    PROJECT_ROOT,
    TEMPLATES_PATH,
    CONTENTS_PATH,
    SRC_PATH,
    OUTPUT_PATH,
    DOCS_OUTPUT_PATH,
    requireFolder
};
