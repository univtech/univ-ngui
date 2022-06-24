// test.ts文件是karma.conf.js需要的文件，用于递归加载所有.spec和框架文件。

import 'zone.js/testing';
import {getTestBed} from '@angular/core/testing';
import {
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// assert腻子脚本使用process时需要。
// 参考：https://github.com/browserify/commonjs-assert/blob/bba838e9ba9e28edf3127ce6974624208502f6bc/internal/assert/assertion_error.js#L138
// 浏览器中使用的Node.js库timezone-mock需要assert腻子脚本。
(globalThis as any).process = {
    env: {},
};

declare const require: {
    context(path: string, deep?: boolean, filter?: RegExp): {
        <T>(id: string): T;
        keys(): string[];
    };
};

// 初始化Angular测试环境
getTestBed().initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting(),
);

// 查找所有测试
const context = require.context('./', true, /\.spec\.ts$/);
// 加载模块
context.keys().forEach(context);
