
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Application specific imports.
import { HttpService } from './http.service';
import { AuthService } from './auth.service';
import { Status } from '../models/status.model';
import { BackendService } from './backend.service';
import { Response } from '../models/response.model';
import { NameEmailModel } from '../models/name-email.model';
import { AuthenticateResponse } from '../components/management/auth/models/authenticate-response.model';

/**
 * Setup service, allows you to setup, read, and manipulate your configuration
 * settings.
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  // Needed to be able to publish configuration changes to components and subscribers of such events.
  private isConfigured = new BehaviorSubject<boolean>(undefined);

  // Current configuration status of current backend.
  private _currentStatus: Status = null;

  /**
   * To detect configuration status
   */
  public configStatus = this.isConfigured.asObservable();

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
    return new Observable<Status>(observer => {
      this.httpService.get<Status>('/magic/system/config/status').subscribe((res: Status) => {
        this._currentStatus = res;
        observer.next(res);
        observer.complete();
        this.isConfigured.next(res.config_done && res.magic_crudified && res.server_keypair);
      }, (error: any) => {
        observer.error(error);
        observer.complete();
      });
    });
  }

  /**
   * Current setup status of system
   */
  public get setupStatus() {
    return this._currentStatus;
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
   * @param password Root user's password to use
   * @param settings Configuration for your system
   */
  public setupSystem(password: string, settings: any) {

    // Invoking backend and returning observable to caller.
    return new Observable<AuthenticateResponse>((observer) => {

      // Invoking backend to setup system.
      this.httpService.post<AuthenticateResponse>('/magic/system/config/setup', {
        password,
        settings,
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

  /**
   * pass config status to all components and let them detect changes in config status if needed
   * @param status boolean
   */
  public changeStatus(status: boolean){
    this.isConfigured.next(status);
  }
}
