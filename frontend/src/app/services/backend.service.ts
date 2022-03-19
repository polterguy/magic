
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Application specific imports.
import { Token } from '../models/token.model';
import { Backend } from '../models/backend.model';
import { Endpoint } from '../models/endpoint.model';
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
    private backendsStorageService: BackendsStorageService) {
    if (this.backendsStorageService.backends.length > 0) {
      for (const idx of this.backendsStorageService.backends.filter(x => x.token)) {
        this.ensureRefreshJWTTokenTimer(idx);
      }
      this.getEndpoints();
    }
  }

  /**
   * Returns the currently used backend.
   */
  get active() {
    return this.backendsStorageService.backends.length === 0 ? null : this.backendsStorageService.backends[0];
  }

  /**
   * Returns all backends.
   */
  get backends() {
    return this.backendsStorageService.backends;
  }

  /**
   * Sets the currently selected backend.
   */
  upsertAndActivate(value: Backend) {
    if (this.backendsStorageService.setActive(value)) {
      this.getEndpoints();
    }
    this.backendsStorageService.persistBackends();
    this.ensureRefreshJWTTokenTimer(this.active);
    this.active.createAccessRights();
    this._authenticated.next(value.token ? true : false);
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
    const cur = this.active;
    this.backendsStorageService.backends = this.backendsStorageService.backends.filter(x => x.url !== backend.url);

    /*
     * Persisting all backends to local storage object,
     * and updating the currently selected backend.
     */
    this.backendsStorageService.persistBackends();
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
        this.backendsStorageService.persistBackends();
        backend.createAccessRights();
        this._authenticated.next(false);

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
      this.backendsStorageService.persistBackends();
      console.log({
        content: 'Token for backend expired',
        backend: backend.url,
      });
      backend.createAccessRights();
      this._authenticated.next(false);
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
          backend.token = null;
          this.backendsStorageService.persistBackends();
          console.error(error);
          backend.createAccessRights();
          this._authenticated.next(false);
        }});
  }

  /*
   * Retrieves endpoints for currently selected backend.
   */
  private getEndpoints() {
    this.httpClient.get<Endpoint[]>(this.active.url + '/magic/system/auth/endpoints').subscribe({
      next: (res) => {
        this.active.applyEndpoints(res || []);
      },
      error: (error: any) => console.error(error)
    });
  }
}
