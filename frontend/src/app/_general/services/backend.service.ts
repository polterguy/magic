
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';

// Application specific imports.
import { Token } from '../../_protected/models/common/token.model';
import { Status } from '../../_protected/models/common/status.model';
import { Backend } from '../../_protected/models/common/backend.model';
import { MagicResponse } from '../models/magic-response.model';
import { CoreVersion } from '../../_protected/models/common/core-version.model';
import { environment } from 'src/environments/environment';
import { BackendsStorageService } from './backendsstorage.service';
import { AuthenticateResponse } from '../../_protected/models/auth/authenticate-response.model';

/**
 * Keeps track of your backends and your currently selected backend.
 *
 * This is your "goto service" when it comes to authentication, and manipulating your backends,
 * adding a new backend, changing your currently active backend, etc.
 */
@Injectable({
  providedIn: 'root'
})
export class BackendService {

  private _authenticated: BehaviorSubject<boolean>;
  private _activeChanged: BehaviorSubject<Backend>;
  private _statusRetrieved: BehaviorSubject<Status>;
  private _versionRetrieved: BehaviorSubject<string>;
  private _latestBazarVersion: string = null;
  private _activeCaptcha = new BehaviorSubject<string>('');
  public _activeCaptchaValue = this._activeCaptcha.asObservable();
  public _bazaarCaptchaKey: string = null;

  authenticatedChanged: Observable<boolean>;
  activeBackendChanged: Observable<Backend>;
  statusRetrieved: Observable<Status>;
  versionRetrieved: Observable<string>;

  constructor(
    private httpClient: HttpClient,
    private backendsStorageService: BackendsStorageService) {

    // Making sure we create refresh token timers for all backends and retrieve endpoints for active backend.
    if (this.backendsStorageService.backends.length > 0) {
      for (const idx of this.backendsStorageService.backends.filter(x => x.token)) {
        this.ensureRefreshJWTTokenTimer(idx);
      }
    }

    this._authenticated = new BehaviorSubject<boolean>(this.active !== null && this.active.token !== null);
    this.authenticatedChanged = this._authenticated.asObservable();

    this._activeChanged = new BehaviorSubject<Backend>(null);
    this.activeBackendChanged = this._activeChanged.asObservable();

    this._statusRetrieved = new BehaviorSubject<Status>(null);
    this.statusRetrieved = this._statusRetrieved.asObservable();

    this._versionRetrieved = new BehaviorSubject<string>(null);
    this.versionRetrieved = this._versionRetrieved.asObservable();
  }

  get active() {

    return this.backendsStorageService.active;
  }

  get backends() {

    return this.backendsStorageService.backends;
  }

  upsert(value: Backend) {

    this.backendsStorageService.upsert(value);
  }

  activate(value: Backend) {

    value = this.backendsStorageService.activate(value);
    this._activeChanged.next(value);
  }

  remove(value: Backend) {

    const activeChanged = value === this.active;
    this.backendsStorageService.remove(value);
    if (value.refreshTimer) {
      clearTimeout(value.refreshTimer);
      value.refreshTimer = null;
    }
    if (activeChanged) {
      this._activeChanged.next(this.active);
    }
  }

  get latestPublishedBazarVersion() {

    return this._latestBazarVersion;
  }

  login(username: string, password: string, storePassword: boolean) {

    return new Observable<AuthenticateResponse>(observer => {
      let query = '';
      if (username && username !== '') {
        query += '?username=' + encodeURIComponent(username);
        query += '&password=' + encodeURIComponent(password);
      }

      // Authenticating towards backend.
      this.httpClient.get<AuthenticateResponse>(
        this.active.url +
        '/magic/system/auth/authenticate' + query).subscribe({
        next: (auth: AuthenticateResponse) => {

          this.active.token = new Token(auth.ticket);
          if (storePassword) {
            this.active.password = password;
          } else {
            this.active.password = null;
          }
          this.backendsStorageService.persistBackends();
          this.ensureRefreshJWTTokenTimer(this.active);
          this._authenticated.next(true);
          this.retrieveStatusAndVersion().subscribe({
            next: () => {

              observer.next(auth);
              observer.complete();
            },
            error: (error: any) => {

              observer.error(error);
              observer.complete();
            }
          });
        },
        error: (error: any) => {

          observer.error(error);
          observer.complete();
        }
      });
    });
  }

  logout(destroyPassword: boolean) {

    this.active.token = null;
    if (this.active.refreshTimer) {
      clearTimeout(this.active.refreshTimer);
      this.active.refreshTimer = null;
    }
    if (destroyPassword) {
      this.active.password = null;
    }
    this.backendsStorageService.persistBackends();
    this._authenticated.next(false);
  }

  verifyToken() {

    if (!this.active?.token) {
      return throwError(() => new Error('No token to verify'));
    }
    return this.httpClient.get<MagicResponse>(
      this.active.url +
      '/magic/system/auth/verify-ticket');
  }

  changePassword(password: string) {

    return this.httpClient.put<MagicResponse>(
      this.active.url +
      '/magic/system/auth/change-password', { password });
  }

  resetPassword(data: any) {

    return this.httpClient.post<MagicResponse>(
      this.active.url +
      '/magic/system/auth/send-reset-password-link', data);
  }

  get shouldUpdate() {

    if (!this.active?.version || !this._latestBazarVersion) {
      return false;
    }
    const lhs = this.active.version.substring(1).split('.');
    const rhs = this._latestBazarVersion.substring(1).split('.');
    for (let idx = 0; idx < 3; ++idx) {
      if (+lhs[idx] < +rhs[idx]) {
        return true;
      }
      if (+lhs[idx] > +rhs[idx]) {
        break;
      }
    }
    return false;
  }

  /*
   * Private helper methods.
   */

  /*
   * Creates a refresh timer for a single backend's JWT token.
   */
  private ensureRefreshJWTTokenTimer(backend: Backend) {

    if (backend.refreshTimer) {
      clearTimeout(backend.refreshTimer);
      backend.refreshTimer = null;
    }

    if (!backend.token) {
      return;
    }

    if (backend.token.exp) {
      if (backend.token.expired) {
        this.logoutFromBackend(backend);
      } else if (backend.token.expires_in < 60) {
        this.refreshJWTToken(backend);
      } else {
        backend.refreshTimer = setTimeout(() => {
          this.refreshJWTToken(backend);
        }, (backend.token.expires_in - 60) * 1000);
      }
    }
  }

  /*
   * Logs out from the specified backend.
   */
  private logoutFromBackend(backend: Backend) {

    if (!backend.token) {
      return; // No change
    }
    backend.token = null;
    this.backendsStorageService.persistBackends();
    if (this.active === backend) {
      this._authenticated.next(false);
    }
  }

  /*
   * Invoked when JWT token needs to be refreshed.
   */
  private refreshJWTToken(backend: Backend) {

    // Deleting old timer if existing.
    if (backend.refreshTimer) {
      clearTimeout(backend.refreshTimer);
      backend.refreshTimer = null;
    }

    // Ensuring user didn't logout after timer was created.
    if (!backend.token) {
      return;
    }

    // Ensuring token is still valid, and if not simply destroying it and returning early.
    if (backend.token.expired) {
      this.logoutFromBackend(backend);
      return;
    }

    // Invoking the refresh token method for backend.
    this.httpClient.get<AuthenticateResponse>(
      backend.url +
      '/magic/system/auth/refresh-ticket').subscribe({
        next: (response: AuthenticateResponse) => {

          console.log({
            content: 'JWT token successfully refreshed',
            backend: backend.url,
          });
          backend.token = new Token(response.ticket);
          this.backendsStorageService.persistBackends();
          this.ensureRefreshJWTTokenTimer(backend);
        },
        error: (error: any) => {

          console.error(error);
        }
      });
  }

  /*
   * Retrieves status of backend and version
   */
  private retrieveStatusAndVersion() {

    // Retrieving status of specified backend.
    return new Observable<Status>(observer => {
      this.httpClient.get<Status>(
        this.active.url +
        '/magic/system/config/status').subscribe({
          next: (status: Status) => {

            // Assigning model.
            this.active.status = status;
            this._statusRetrieved.next(status);

            // Retrieving version of backend
            this.httpClient.get<CoreVersion>(
              this.active.url +
              '/magic/system/version').subscribe({
                next: (version: CoreVersion) => {

                  this.active.version = version.version;
                  if (this._latestBazarVersion) {
                    this._versionRetrieved.next(this.active.version);
                    observer.next(status);
                    observer.complete();

                  } else {
                    this.httpClient.get<MagicResponse>(
                      environment.bazarUrl +
                      '/magic/modules/bazar/core-version').subscribe({
                        next: (latestVersion: MagicResponse) => {

                          this._latestBazarVersion = latestVersion.result;
                          this._versionRetrieved.next(this.active.version);
                          observer.next(status);
                          observer.complete();
                        },
                        error: (error: any) => {

                          observer.error(error);
                          observer.complete();
                        }
                      });
                  }
                  this.getRecaptchaKey();
                },
                error: (error: any) => {

                  observer.error(error);
                  observer.complete();
                }
              });
          },
          error: (error: any) => {

            observer.error(error);
            observer.complete();
          }
        });
    });
  }

  public setReCaptchaKeySecret(key: string, secret: string) {

    return this.httpClient.post<MagicResponse>(
      this.active.url +
      '/magic/system/auth/recaptcha-secret-key', {
        key,
        secret,
      });
  }

  /**
   * Returns both the reCAPTCHA secret and site key.
   */
  public getReCaptchaKeySecret() {

    return this.httpClient.get<any>(
      this.active.url +
      '/magic/system/auth/recaptcha-secret-key');
  }

  /**
   * Retrieving recaptcha, if existing.
   */
  public getRecaptchaKey() {

    this.httpClient.get<MagicResponse>(
      environment.bazarUrl +
      '/magic/system/auth/recaptcha-key').subscribe({
        next: (recaptcha: MagicResponse) => {
          this._bazaarCaptchaKey = recaptcha.result;
        }
      });
    this.httpClient.get<MagicResponse>(
      this.active.url +
      '/magic/system/auth/recaptcha-key').subscribe({
        next: (recaptcha: MagicResponse) => {
          this._activeCaptcha.next(recaptcha.result);
        }
      });
  }
}
