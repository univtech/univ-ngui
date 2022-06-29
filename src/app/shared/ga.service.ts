import {Inject, Injectable} from '@angular/core';

import {environment} from '../../environments/environment';
import {WindowToken} from 'app/shared/window';

/**
 * 谷歌分析服务：Google Analytics（GA）。<br>
 * 捕获应用程序行为并发送到谷歌分析服务。<br>
 * 假设Web页面的某个脚本已经加载GA脚本。<br>
 * 把数据和环境中的GA属性gaId关联起来。<br>
 */
@Injectable()
export class GaService {

    /** 前一个URL */
    private previousUrl: string;

    /**
     * 构造函数，创建GaService。
     *
     * @param window Window对象
     */
    constructor(@Inject(WindowToken) private window: Window) {
        this.ga('create', environment.gaId, 'auto');
    }

    /**
     * 位置变更，发送页面。
     *
     * @param url 页面路径
     */
    locationChanged(url: string) {
        this.sendPage(url);
    }

    /**
     * 发送页面。
     *
     * @param url 页面路径
     */
    sendPage(url: string) {
        // URL未变更时，不重新发送
        if (url === this.previousUrl) {
            return;
        }
        this.previousUrl = url;
        this.ga('set', 'page', '/' + url);
        this.ga('send', 'pageview');
    }

    /**
     * 发送事件。
     *
     * @param source 来源
     * @param action 操作
     * @param label 标签
     * @param value 值
     */
    sendEvent(source: string, action: string, label?: string, value?: number) {
        this.ga('send', 'event', source, action, label, value);
    }

    /**
     * 谷歌分析服务。
     *
     * @param args 参数
     */
    ga(...args: any[]) {
        const gaFn = (this.window as any).ga;
        if (gaFn) {
            gaFn(...args);
        }
    }

}
