
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { Backend } from '../models/backend.model';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthenticateResponse } from '../components/management/auth/models/authenticate-response.model';

/**
 * Keeps track of your backend URLs and currently selected backends.
 * 
 * This service will store your backends in the local storage object,
 * to allow for easily selecting a backend you have previously connected to.
 */
@Injectable({
  providedIn: 'root'
})
export class BackendService {

  private _backends: Backend[] = [];
  private _current: Backend = null;

  /**
   * Creates an instance of your service.
   * 
   * @httpClient Needed to refresh JWT token for backends
   */
  constructor(private httpClient: HttpClient) {

    // Reading persisted backends from local storage, or defaulting to whatever is in our environment.ts file.
    let backends: Backend[];
    const storage = localStorage.getItem('magic.backends');

    /*
     * Notice, we only use the default environment.ts based default backend(s) if we're on localhost.
     *
     * This simplifies usage of Magic on the local development machine, but guessing the backend is
     * really impossible if we'rein production in a non-localhost environment.
     */
    backends = storage === null ? (window.location.href.indexOf('://localhost') === -1 ? [] : environment.defaultBackends) : <Backend[]>JSON.parse(storage);
    this._backends = backends;

    // Checking we actually have any backends stored.
    if (this._backends.length > 0) {

      // We always use the first backend as our "current" backend.
      this._current = this._backends[0];

      // Making sure we create a "refresh JWT token" timer for all backends fetched from localStorage.
      for (const idx of this._backends) {
        this.ensureRefreshJWTTokenTimer(idx);
      }
    }
  }

  /**
   * Returns true if user is connected to a backend.
   */
  public get connected() {
    return !!this._current;
  }

  /**
   * Returns the currently used backend API URL.
   */
  public get current() {
    return this._current;
  }

  /**
   * Removes specified backend from local storage and if it is the current 
   * backend changes the backend to the next available backend.
   * 
   * @param backend Backend to remove
   */
  public remove(backend: Backend) {

    // Ensuring we destroy refresh token timer if existing.
    if (backend.refreshTimer) {
      clearTimeout(backend.refreshTimer);
      backend.refreshTimer = null;
    }

    // We need to track current backend such that we can return to caller whether or not refreshing UI is required.
    const cur = this.current;
    this._backends = this._backends.filter(x => x.url !== backend.url);

    /*
     * Persisting all backends to local storage object,
     * and updating the currently selected backend.
     */
    this.persistBackends();
    this._current = this._backends.length > 0 ? this._backends[0] : null;
    return cur.url === backend.url;
  }

  /**
   * Sets the currently selected backend.
   */
  public set current(value: Backend) {

    /*
     * Checking to see if the backend exists from before,
     * and if it does we update its fields. If not, we append
     * a new backend to the list of backends we handle.
     */
    const existing = this._backends.filter(x => x.url === value.url);
    if (existing.length > 0) {

      // Updating existing backend's fields.
      existing[0].username = value.username;
      existing[0].password = value.password;
      existing[0].token = value.token;
      value = existing[0];

    } else {

      // Appending backend.
      this._backends.push(value);
    }

    /*
     * Making sure we sort backends such that the current backend
     * becomes the first in our list of backends, which makes sure
     * that if the user refreshes the browser, this is the backend
     * that will be used.
     */
    this._backends.sort((lhs: Backend, rhs: Backend) => {
      if (lhs.url === value.url) {
        return -1;
      }
      if (rhs.url === value.url) {
        return 1;
      }
      return 0;
    });

    /*
     * Persisting all backends to local storage object,
     * and updating the currently selected backend.
     */
    this.persistBackends();
    this._current = value;

    // Ensuring we create a JWT refresh timer for current backend.
    this.ensureRefreshJWTTokenTimer(this.current);
  }

  /**
   * 
   * @param url URL of backend to make active.
   */
  public setActiveBackend(url: string) {

    /*
     * Making sure we sort backends such that the current backend
     * becomes the first in our list of backends, which makes sure
     * that if the user refreshes the browser, this is the backend
     * that will be used.
     */
    this._backends.sort((lhs: Backend, rhs: Backend) => {
      if (lhs.url === url) {
        return -1;
      }
      if (rhs.url === url) {
        return 1;
      }
      return 0;
    });

    /*
     * Persisting all backends to local storage object,
     * and updating the currently selected backend.
     */
    this.persistBackends();
    this._current = this._backends[0];
  }

  /**
   * Returns true if we are securely connected to a backend.
   */
  public get secure() {
    return this.connected && this._current.url.startsWith('https://');
  }

  /**
   * Returns all backends the system has persisted.
   */
  public get backends() {
    return this._backends;
  }

  /**
   * Persists all backends into local storage.
   */
  public persistBackends() {

    // Making sure we only persist non-null fields and that we do NOT persist "refreshTimer" field.
    const toPersist: any[] = [];
    for (const idx of this._backends) {
      var idxPersist: Backend = {
        url: idx.url,
      };
      if (idx.username) {
        idxPersist.username = idx.username;
      }
      if (idx.password) {
        idxPersist.password = idx.password;
      }
      if (idx.token) {
        idxPersist.token = idx.token;
      }
      toPersist.push(idxPersist);
    }
    localStorage.setItem('magic.backends', JSON.stringify(toPersist));
  }

  /**
   * Returns true if specified JWT token is expired.
   * 
   * @param token Token to check
   */
  public isTokenExpired(token: string) {

    // Parsing expiration time from JWT token.
    const exp = (JSON.parse(atob(token.split('.')[1]))).exp;
    const now = Math.floor(new Date().getTime() / 1000);
    return now >= exp;
  }

  /*
   * Private helper methods.
   */

  /*
   * Creates a refresh timer for a single backend's JWT token.
   */
   private ensureRefreshJWTTokenTimer(backend: Backend) {

    // Checking if we've already got a timer function, and if so deleting it.
    if (backend.refreshTimer) {
      clearTimeout(backend.refreshTimer);
      backend.refreshTimer = null;
    }

    // Ensuring we've got a token, and if not we don't create the timer.
    if (!backend.token) {
      return;
    }

    // Parsing token to see if it's got "exp" declaration.
    const entities: string[] = backend.token.split('.');
    const payloadStr: string = atob(entities[1]);
    const payload: any = JSON.parse(payloadStr);

    // Verifying token has "exp" declaration.
    if (payload.exp) {
      const exp: number = payload.exp;
      const now = Math.floor(new Date().getTime() / 1000);
      const secondsToExpire = (exp - now);

      if (secondsToExpire < 0) {

        // Token has already expired, hence deleting token and persisting backends.
        backend.token = null;
        this.persistBackends();

      } else if (secondsToExpire < 60) {

        // Less than 60 minutes to expiration, hence refreshing immediately.
        this.refreshJWTToken(backend);

      } else {

        // Creating a timer that kicks in 60 seconds before token expires where we refresh JWT token.
        setTimeout(() => {
          this.refreshJWTToken(backend);
        }, (secondsToExpire - 60) * 1000);
      }
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

    // Invoking the refresh token method for backend.
    this.httpClient.get<AuthenticateResponse>(
      backend.url +
      '/magic/system/auth/refresh-ticket').subscribe((response: AuthenticateResponse) => {

        // Doing some basic logging.
        console.log({
          content: 'JWT token successfully refreshed',
          backend: backend.url,
        });

        // Assigning new token to backend and persisting now with new token.
        backend.token = response.ticket;
        this.persistBackends();

        // Making sure we're able to refresh again once it's time.
        this.ensureRefreshJWTTokenTimer(backend);
        
      }, (error: any) => console.error(error));
  }
}
