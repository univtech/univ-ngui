import {InjectionToken, StaticProvider} from '@angular/core';
import {WindowToken} from './window';

// 本地存储
export const LocalStorage = new InjectionToken<Storage>('LocalStorage');

// 会话存储
export const SessionStorage = new InjectionToken<Storage>('SessionStorage');

// 存储提供器
export const STORAGE_PROVIDERS: StaticProvider[] = [
    {provide: LocalStorage, useFactory: (win: Window) => getStorage(win, 'localStorage'), deps: [WindowToken]},
    {provide: SessionStorage, useFactory: (win: Window) => getStorage(win, 'sessionStorage'), deps: [WindowToken]},
];

// 什么都不做的Storage。<br>
// Storage用于访问特定领域的会话或本地存储。
export class NoopStorage implements Storage {
    length = 0;

    key() {
        return null;
    }

    getItem() {
        return null;
    }

    setItem() {

    }

    removeItem() {

    }

    clear() {

    }
}

// 浏览器禁用Cookie时，访问window[storageType]会抛出错误。这样的话，将会返回NoopStorage。
function getStorage(win: Window, storageType: 'localStorage' | 'sessionStorage'): Storage {
    try {
        return win[storageType];
    } catch {
        return new NoopStorage();
    }
}
