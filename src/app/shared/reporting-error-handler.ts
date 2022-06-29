import {ErrorHandler, Inject, Injectable, VERSION} from '@angular/core';
import {WindowToken} from './window';

/**
 * 扩展默认的错误处理器，向外部服务报告错误，例如：谷歌分析服务。<br>
 * Angular应用程序之外的错误也可以通过window.onerror来处理。
 */
@Injectable()
export class ReportingErrorHandler extends ErrorHandler {

    /**
     * 构造函数，创建ReportingErrorHandler。
     *
     * @param window Window对象
     */
    constructor(@Inject(WindowToken) private window: Window) {
        super();
    }

    /**
     * 处理错误信息，把错误信息发送到谷歌分析服务。
     *
     * @param error 错误信息
     */
    override handleError(error: any) {
        const versionedError = this.prefixErrorWithVersion(error);

        try {
            super.handleError(versionedError);
        } catch (e) {
            this.reportError(e);
        }
        this.reportError(versionedError);
    }

    /**
     * 在错误信息前面添加版本信息。
     *
     * @param error 错误信息
     */
    private prefixErrorWithVersion<T>(error: T): T {
        const prefix = `[v${VERSION.full}] `;

        if (error instanceof Error) {
            const oldMessage = error.message;
            const oldStack = error.stack;

            error.message = prefix + oldMessage;
            error.stack = oldStack?.replace(oldMessage, error.message);
        } else if (typeof error === 'string') {
            error = prefix + error as unknown as T;
        }

        // 其他类型，返回原始错误对象
        return error;
    }

    /**
     * 报告错误。
     *
     * @param error 错误信息
     */
    private reportError(error: unknown) {
        if (this.window.onerror) {
            if (error instanceof Error) {
                this.window.onerror(error.message, undefined, undefined, undefined, error);
            } else {
                if (typeof error === 'object') {
                    try {
                        error = JSON.stringify(error);
                    } catch {
                        // 忽略错误
                    }
                }
                this.window.onerror(`${error}`);
            }
        }
    }

}
