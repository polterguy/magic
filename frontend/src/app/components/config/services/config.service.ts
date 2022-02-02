
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';

// Application specific imports.
import { Status } from '../../../models/status.model';
import { Response } from '../../../models/response.model';
import { NameEmailModel } from '../models/name-email.model';
import { HttpService } from '../../../services/http.service';
import { AuthService } from '../../auth/services/auth.service';
import { BackendService } from '../../../services/backend.service';
import { DefaultDatabaseType } from '../models/default-database-type.model';
import { AuthenticateResponse } from '../../auth/models/authenticate-response.model';

/**
 * Setup service, allows you to setup, read, and manipulate your configuration
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
   * @param authService Necessary to create refresh JWT token timer once setup process is done
   * @param backendService Necessary to persist JWT token for client once setup process is done
   */
  constructor(
    private httpService: HttpService,
    private authService: AuthService,
    private backendService: BackendService) { }

  /**
   * Returns the status of the backend.
   */
  public status() {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<Status>('/magic/system/config/status');
  }

  /**
   * Returns the root user's email address
   */
   public rootUserEmailAddress() {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<NameEmailModel>('/magic/system/emails/email');
  }

  /**
   * Loads your configuration.
   */
  public loadConfig() {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<any>('/magic/system/config/load');
  }

  /**
   * Saves your configuration.
   */
  public saveConfig(config: any) {

    // Invoking backend and returning observable to caller.
    return this.httpService.post<Response>('/magic/system/config/save', config);
  }

  /**
   * Will setup your system according to the specified arguments.
   * 
   * @param databaseType Default database type to use for your magic database
   * @param password Root user's password to use
   * @param settings Configuration for your system
   */
  public setup(databaseType: string, password: string, settings: any) {

    // Invoking backend and returning observable to caller.
    return new Observable<AuthenticateResponse>((observer) => {

      // Invoking backend to setup system.
      this.httpService.post<AuthenticateResponse>('/magic/system/config/setup', {
        databaseType,
        password,
        settings: JSON.stringify(settings, null, 2),
      }).subscribe((res: AuthenticateResponse) => {

        /*
        * Notice, when setup is done, the backend will return a new JWT token
        * which we'll have to use for consecutive invocations towards the backend.
        */
        this.backendService.current = {
          url: this.backendService.current.url,
          username: 'root',
          password: null,
          token: res.ticket,
        };

        // Making sure we refresh JWT token before it expires.
        this.authService.createRefreshJWTTimer(this.backendService.current);

        // Finishing observable.
        observer.next(res);
        observer.complete();

      }, (error: any) => {

        // Passing error onwards, and completing observable.
        observer.error(error);
        observer.complete();
      });
    });
  }

  /**
   * Generates a cryptographically secure piece of random text (gibberish)
   * by invoking backend endpoint responsible for creating it.
   * 
   * @param min Minimum length of gibberish to return
   * @param max Maximum length of gibberish to return
   */
  public getGibberish(min: number, max: number) {
    return this.httpService.get<Response>(
      '/magic/system/misc/gibberish?min=' +
      min +
      '&max=' + max);
  }

  /**
   * Compares the two specified versions, and returns an integer declaring which comes before the other.
   * 
   * @param version_1 First version to compare
   * @param version_2 Second version to compare
   */
  public versionCompare(version_1: string, version_2: string) {

    // Invoking backend returning an observable to caller.
    return this.httpService.get(
      '/magic/system/config/version-compare?version_1=' +
      encodeURIComponent(version_1) + 
      '&version_2=' +
      encodeURIComponent(version_2));
  }
}
