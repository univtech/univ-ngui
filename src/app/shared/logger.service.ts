import {ErrorHandler, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';

@Injectable()
export class Logger {

    constructor(private errorHandler: ErrorHandler) {

    }

    log(message: any, ...params: any[]) {
        if (!environment.production) {
            console.log(message, ...params);
        }
    }

    warn(message: any, ...params: any[]) {
        console.warn(message, ...params);
    }

    error(error: Error) {
        this.errorHandler.handleError(error);
    }

}
