
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from './http.service';
import { AuthService } from './auth.service';
import { Status } from '../models/status.model';
import { KeyPair } from '../models/key-pair.model';
import { BackendService } from './backend.service';
import { Response } from '../models/response.model';
import { AuthenticateResponse } from '../models/authenticate-response.model';

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
    return this.httpService.get<Status>('/magic/modules/system/config/setup-status');
  }

  /**
   * Returns the type of database that is the default database used by backend.
   */
  public defaultDatabaseType() {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<Response>('/magic/modules/system/config/default-database-type');
  }

  /**
   * Loads your configuration.
   */
  public loadConfig() {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<any>('/magic/modules/system/config/load-config');
  }

  /**
   * Saves your configuration.
   */
  public saveConfig(config: any) {

    // Invoking backend and returning observable to caller.
    return this.httpService.post<Response>('/magic/modules/system/config/save-config', config);
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
      this.httpService.post<AuthenticateResponse>('/magic/modules/system/config/setup', {
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
      '/magic/modules/system/misc/gibberish?min=' +
      min +
      '&max=' + max);
  }

  /**
   * Returns license information to caller.
   */
  public license() {

    // Invoking backend and returns license information to caller.
    return this.httpService.get<any>('/magic/modules/system/config/license');
  }

  /**
   * Applies a license to the system.
   * 
   * @param license License content
   */
  public saveLicense(license: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.post<Response>('/magic/modules/system/config/save-license', {
      license,
    });
  }

  /**
   * Generates a cryptography key pair for your server.
   * 
   * @param strength Strength of key pair to generate, typically 2048, 4096, or some other exponent of 2
   * @param seed Used to seed the CSRNG object
   */
  public generateKeyPair(strength: number, seed: string) {

    // Invoking backend and returning observable to caller.
    return this.httpService.post<KeyPair>('/magic/modules/system/config/generate-keypair', {
      strength,
      seed,
    });
  }
}
