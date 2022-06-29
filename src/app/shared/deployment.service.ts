import {Injectable} from '@angular/core';
import {LocationService} from 'app/shared/location.service';
import {environment} from 'environments/environment';

/**
 * 应用程序的部署信息。
 */
@Injectable()
export class Deployment {

    /**
     * 构建时使用的环境中设置的部署模式，或者通过mode查询参数来覆盖，例如：...?mode=archive
     */
    mode: string = this.location.search().mode || environment.mode;

    constructor(private location: LocationService) {

    }

}
