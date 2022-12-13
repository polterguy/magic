
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';

// Application specific imports.
import { Response } from 'src/app/_protected/models/common/response.model';
import { BackendService } from 'src/app/_general/services/backend.service';
import { AuthenticateResponse } from 'src/app/_protected/models/auth/authenticate-response.model';
import { NameEmailModel } from 'src/app/_protected/models/auth/name-email.model';
import { Backend } from 'src/app/_protected/models/common/backend.model';
import { SetupModel } from '../../../../models/common/status.model';
import { HttpService } from 'src/app/_general/services/http.service';

/**
 * Configuration service, allows you to setup system and read or manipulate your configuration
 * settings.
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  /**
   * Creates an instance of your service.
   *
   * @param httpService HTTP service to use for backend invocations
   * @param backendService Necessary to persist JWT token for client once setup process is done
   */
  constructor(
    private httpService: HttpService,
    private backendService: BackendService) { }

  /**
   * Returns the root user's email address
   */
  rootUserEmailAddress() {
    return this.httpService.get<NameEmailModel>('/magic/system/emails/email');
  }

  /**
   * Loads your configuration.
   */
  loadConfig() {
    return this.httpService.get<any>('/magic/system/config/load');
  }

  /**
   * Saves your configuration.
   */
  saveConfig(config: any) {
    return this.httpService.post<Response>('/magic/system/config/save', config);
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

  /**
   * Invoked when modules needs to be installed for some reasons, which
   * might be a requirement after the system has been setup.
   */
  installModules() {
    return this.httpService.post<any>('/magic/system/config/install-modules', {});
  }

  /**
   * Generates a cryptographically secure piece of random text (gibberish)
   * by invoking backend endpoint responsible for creating it.
   *
   * @param min Minimum length of gibberish to return
   * @param max Maximum length of gibberish to return
   */
  getGibberish(min: number, max: number) {
    return this.httpService.get<Response>('/magic/system/misc/gibberish?min=' + min + '&max=' + max);
  }

  /**
   * Compares the two specified versions, and returns an integer declaring which comes before the other.
   *
   * @param version_1 First version to compare
   * @param version_2 Second version to compare
   */
  versionCompare(version_1: string, version_2: string) {
    return this.httpService.get(
      '/magic/system/config/version-compare?version_1=' +
      encodeURIComponent(version_1) +
      '&version_2=' +
      encodeURIComponent(version_2));
  }

  getDatabases() {
    return this.httpService.get('/magic/system/sql/default-database-type');
  }

  connectionStringValidity(data: any) {
    return this.httpService.post('/magic/system/sql/test-connection-string', data);
  }
}
