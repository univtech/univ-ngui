import {NgZone} from '@angular/core';
import {Observable} from 'rxjs';
import {WebWorkerMessage} from './web-worker-message';

export class WebWorkerClient {

    private nextId = 0;

    /**
     * 创建WebWorkerClient。
     *
     * @param worker Worker 可以通过脚本来创建并向其创建者发送消息的后台任务
     * @param zone NgZone 在Angular区域内部或者外部执行任务的服务
     */
    static create(worker: Worker, zone: NgZone) {
        return new WebWorkerClient(worker, zone);
    }

    /**
     * 私有构造函数，创建WebWorkerClient。
     *
     * @param worker 可以通过脚本来创建并向其创建者发送消息的后台任务
     * @param zone 在Angular区域内部或者外部执行任务的服务
     * @private
     */
    private constructor(private worker: Worker, private zone: NgZone) {

    }

    /**
     * 发送消息。
     *
     * @param type 消息类型
     * @param payload 有效负载
     */
    sendMessage<T>(type: string, payload?: any): Observable<T> {
        return new Observable<T>(subscriber => {
            const id = this.nextId++;

            // 消息事件处理器
            const handleMessage = (response: MessageEvent) => {
                const {
                    id: responseId,
                    type: responseType,
                    payload: responsePayload
                } = response.data as WebWorkerMessage;
                if (id === responseId && type === responseType) {
                    this.zone.run(() => {
                        subscriber.next(responsePayload);
                        subscriber.complete();
                    });
                }
            };

            // 错误事件处理器
            const handleError = (error: ErrorEvent) => {
                // 因为我们不检查id和类型，Web Worker的任何错误都会停止所有订阅者
                this.zone.run(() => subscriber.error(error));
            };

            // 添加事件监听器
            this.worker.addEventListener('message', handleMessage);
            this.worker.addEventListener('error', handleError);

            // 把消息发送到Web Worker
            this.worker.postMessage({type, id, payload});

            // 完成或错误时，移除事件监听器
            return () => {
                this.worker.removeEventListener('message', handleMessage);
                this.worker.removeEventListener('error', handleError);
            };
        });
    }

}
