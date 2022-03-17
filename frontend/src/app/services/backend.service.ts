
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

// Application specific imports.
import { Token } from '../models/token.model';
import { Backend } from '../models/backend.model';
import { Endpoint } from '../models/endpoint.model';
import { Response } from 'src/app/models/response.model';
import { BackendsStorageService } from './backendsstorage.service';
import { AuthenticateResponse } from '../components/management/auth/models/authenticate-response.model';

/**
 * Keeps track of your backends and your currently selected backend.
 * 
 * This service will store your backends in the localStorage object,
 * to allow for easily selecting a backend you have previously connected to.
 */
@Injectable({
  providedIn: 'root'
})
export class BackendService {

  private _authenticated = new BehaviorSubject<boolean>(undefined);

  /**
   * To allow consumers to subscribe to authentication status changes.
   */
  authenticatedChanged = this._authenticated.asObservable();

  /**
   * Creates an instance of your service.
   * 
   * @httpClient Needed to refresh JWT token for backends
   * @backendsListService List of all backends in system
   */
  constructor(
    private httpClient: HttpClient,
    private backendsListService: BackendsStorageService) {

    // Checking we actually have any backends stored.
    if (this.backendsListService.backends.length > 0) {
      for (const idx of this.backendsListService.backends) {
        this.ensureRefreshJWTTokenTimer(idx);
      }
      this.getEndpoints();
    }
  }

  /**
   * Returns the currently used backend.
   */
  get current() {
    return this.backendsListService.backends.length === 0 ? null : this.backendsListService.backends[0];
  }

  /**
   * Returns all backends.
   */
  get backends() {
    return this.backendsListService.backends;
  }

  /**
   * Sets the currently selected backend.
   */
  upsertAndActivate(value: Backend) {
    if (this.backendsListService.setActive(value)) {
      this.getEndpoints();
    }
    this.backendsListService.persistBackends();
    this.ensureRefreshJWTTokenTimer(this.current);
  }

  /**
   * Verifies validity of token by invoking backend.
   */
   verifyTokenForCurrent() {

    // Invokes backend and returns observable to caller.
    return this.httpClient.get<Response>(
      this.current.url +
      '/magic/system/auth/verify-ticket');
  }

  /**
   * Invokes specified backend to check if auto-auth has been turned on.
   * 
   * @param url URL of backend to check
   */
  autoAuth(url: string) {
    return this.httpClient.get<Response>(url.replace(/\s/g, '').replace(/(\/)+$/, '') + '/magic/system/auth/auto-auth');
  }

  /**
   * Authenticates user towards current backend.
   * 
   * @param username Username
   * @param password Password
   * @param storePassword Whether or not passsword should be persisted into local storage
   */
  loginToCurrent(username: string, password: string, storePassword: boolean) {
    const url = this.current.url;
    return new Observable<AuthenticateResponse>(observer => {

      let query = '';
      if (username && username !== '') {
        query += '?username=' + encodeURIComponent(username);
        query += '&password=' + encodeURIComponent(password);
      }

      this.httpClient.get<AuthenticateResponse>(
        this.current.url +
        '/magic/system/auth/authenticate' + query, {

          /*
           * Notice, if we're doing Windows automatic authentication,
           * we will not be given a username/password combination to this method, at which point
           * we'll have to make sure Angular passes in Windows credentials to endpoint.
           */
          withCredentials: query === '' ? true : false,

        }).subscribe((auth: AuthenticateResponse) => {

          // Setting backend we just authenticated towards to the active backend.
          const cur = new Backend(url, username, storePassword ? password : null, auth.ticket);
          this.upsertAndActivate(cur);

          // Invoking next link in chain of observables.
          observer.next(auth);
          observer.complete();

          // Ensuring subscribers to authentication status is notified.
          this._authenticated.next(true);
          console.log({
            content: 'User successfully authenticated towards backend',
            username: username,
            backend: url,
          });

        }, (error: any) => {
          console.log({
            content: 'Could not authenticate towards backend',
            username: username,
            backend: url,
            error,
          });
          observer.error(error);
          observer.complete();
        });
    });
  }

  /**
   * Logs out the user from his currently active backend.
   * 
   * @param destroyPassword Whether or not password should be removed before persisting backend
   */
  logoutFromCurrent(destroyPassword: boolean) {
    if (this.current?.token) {
      const cur = new Backend(this.current.url, this.current.username, destroyPassword ? null : this.current.password);
      this.upsertAndActivate(cur);
      this.current.createAccessRights();
      this._authenticated.next(false);
    }
  }

  /**
   * Removes specified backend from local storage and if it is the current 
   * backend changes the backend to the next available backend.
   * 
   * @param backend Backend to remove
   */
  remove(backend: Backend) {

    // Ensuring we destroy refresh token timer if existing.
    if (backend.refreshTimer) {
      clearTimeout(backend.refreshTimer);
      backend.refreshTimer = null;
    }

    // We need to track current backend such that we can return to caller whether or not refreshing UI is required.
    const cur = this.current;
    this.backendsListService.backends = this.backendsListService.backends.filter(x => x.url !== backend.url);

    /*
     * Persisting all backends to local storage object,
     * and updating the currently selected backend.
     */
    this.backendsListService.persistBackends();
    return cur.url === backend.url;
  }

  /**
   * Fetches endpoints for current backend again.
   */
  refetchEndpoints() {
    this.getEndpoints();    
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

    if (backend.token.exp) {

      // Token has "exp" declaration, implying it'll expire at some point.
      if (backend.token.expired) {

        // Token has already expired, hence deleting token and persisting backends.
        backend.token = null;
        this.backendsListService.persistBackends();

      } else if (backend.token.expires_in < 60) {

        // Less than 60 minutes to expiration, hence refreshing immediately.
        this.refreshJWTToken(backend);

      } else {

        // Creating a timer that kicks in 60 seconds before token expires where we refresh JWT token.
        setTimeout(() => {
          this.refreshJWTToken(backend);
        }, (backend.token.expires_in - 60) * 1000);
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

    // Ensuring token is still valid, and if not simply destroying it and returning early.
    if (backend.token.expired) {
      backend.token = null;
      this.backendsListService.persistBackends();
      console.log({
        content: 'Token for backend expired',
        backend: backend.url
      });
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
        backend.token = new Token(response.ticket);
        this.backendsListService.persistBackends();

        // Making sure we're able to refresh again once it's time.
        this.ensureRefreshJWTTokenTimer(backend);
        
      }, (error: any) => {

        backend.token = null;
        this.backendsListService.persistBackends();
        console.error(error);
      });
  }

  /*
   * Retrieves endpoints for currently selected backend.
   */
  private getEndpoints() {
    this.httpClient.get<Endpoint[]>(this.current.url + '/magic/system/auth/endpoints').subscribe(res => {
      this.current.applyEndpoints(res || []);
    }, error => console.error(error));
  }
}
