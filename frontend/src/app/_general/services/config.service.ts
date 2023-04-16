
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

// Angular and system imports.
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';

// Application specific imports.
import { MagicResponse } from 'src/app/_general/models/magic-response.model';
import { BackendService } from 'src/app/_general/services/backend.service';
import { AuthenticateResponse } from 'src/app/_protected/models/auth/authenticate-response.model';
import { NameEmailModel } from 'src/app/_protected/models/auth/name-email.model';
import { Backend } from 'src/app/_protected/models/common/backend.model';
import { HttpService } from 'src/app/_general/services/http.service';
import { SetupModel } from 'src/app/_protected/models/common/setup.model';

/**
 * Configuration service, allows you to setup system and read or manipulate your configuration
 * settings.
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  constructor(
    private httpService: HttpService,
    private backendService: BackendService) { }

  rootUserEmailAddress() {

    return this.httpService.get<NameEmailModel>('/magic/system/emails/email');
  }

  loadConfig() {

    return this.httpService.get<any>('/magic/system/config/load');
  }

  saveConfig(config: any) {

    return this.httpService.post<MagicResponse>('/magic/system/config/save', config);
  }

  setup(payload: SetupModel) {

    return new Observable<AuthenticateResponse>(observer => {
      return this.httpService.post<AuthenticateResponse>(
        '/magic/system/config/setup',
        payload).subscribe({
          next: (auth: AuthenticateResponse) => {

            const backend = new Backend(this.backendService.active.url, 'root', null, auth.ticket);
            this.backendService.upsert(backend);
            this.backendService.activate(backend);
            observer.next(auth);
            observer.complete();
          },
          error: (error: any) => {

            observer.error(error);
            observer.complete();
          }
        });
    });
  }

  installModules() {

    return this.httpService.post<any>('/magic/system/config/install-modules', {});
  }

  getGibberish(min: number, max: number) {

    return this.httpService.get<MagicResponse>('/magic/system/misc/gibberish?min=' + min + '&max=' + max);
  }

  versionCompare(version_1: string, version_2: string) {

    const lhs = version_1.substring(1).split('.');
    const rhs = version_2.substring(1).split('.');
    for (let idx = 0; idx < 3; idx++) {
      if (lhs[idx] < rhs[idx]) {
        return -1;
      }
      if (lhs[idx] > rhs[idx]) {
        return 1;
      }
    }
    return 0;
  }

  getDatabases() {

    return this.httpService.get('/magic/system/sql/default-database-type');
  }

  testConnectionString(databaseType: string, connectionString: string) {

    return this.httpService.post('/magic/system/sql/test-connection-string', {
      databaseType,
      connectionString,
    });
  }
}
