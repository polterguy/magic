
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
  private _activeChanged = new BehaviorSubject<Backend>(undefined);

  /**
   * To allow consumers to subscribe to authentication status changes.
   */
  authenticatedChanged = this._authenticated.asObservable();

  /**
   * To allow consumers to subscribe to active backend changed events.
   */
  activeChanged = this._activeChanged.asObservable();

  /**
   * Creates an instance of your service.
   * 
   * @httpClient Needed to refresh JWT token for backends
   * @backendsListService List of all backends in system
   */
  constructor(
    private httpClient: HttpClient,
    private backendsStorageService: BackendsStorageService) {

    // Making sure we create refresh token timers for all backends and retrieve endpoints for active backend.
    if (this.backendsStorageService.backends.length > 0) {
      for (const idx of this.backendsStorageService.backends.filter(x => x.token)) {
        this.ensureRefreshJWTTokenTimer(idx);
      }
      this.getEndpoints(this.active);
    }
  }

  /**
   * Returns the currently active backend.
   */
  get active() {
    return this.backendsStorageService.active;
  }

  /**
   * Returns all backends.
   */
  get backends() {
    return this.backendsStorageService.backends;
  }

  /**
   * Upserts a new backend and activates it.
   * 
   * @param value Backend to upsert and activate
   * @returns True if active backend was changed
   */
  upsertAndActivate(value: Backend) {
    const hasChanged = value.url !== this.active?.url;
    const wasAuthenticated = !!this.active?.token;
    if (this.backendsStorageService.upsertAndActivate(value)) {
      this.getEndpoints(value);
    }
    this.ensureRefreshJWTTokenTimer(value);
    if (hasChanged) {
      this._activeChanged.next(this.active);
    }
    const isAuthenticated = !!this.active.token;
    if (wasAuthenticated !== isAuthenticated) {
      this._authenticated.next(isAuthenticated);
    }
    return hasChanged;
  }

  /**
   * Removes specified backend from local storage and if it is the current 
   * backend changes the backend to the next available backend.
   * 
   * @param value Backend to remove
   * @returns True if active backend was changed
   */
  remove(value: Backend) {
    if (this.backendsStorageService.backends.filter(x => x.url === value.url).length === 0) {
      throw 'No such backend';
    }
    const wasAuthenticated = !!this.active.token;
    if (this.backendsStorageService.remove(value)) {
      this._activeChanged.next(this.active);
      const isAuthenticated = !!this.active?.token;
      if (wasAuthenticated !== isAuthenticated) {
        this._authenticated.next(isAuthenticated);
      }
      return true;
    }
    return false;
  }

  /**
   * Fetches endpoints for current backend again.
   */
  refetchEndpoints() {
    this.getEndpoints(this.active);
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
        setTimeout(() => {
          this.refreshJWTToken(backend);
        }, (backend.token.expires_in - 60) * 1000);
      }
    }
  }

  /*
   * Logs out from the specified backend.
   */
  private logoutFromBackend(backend: Backend) {
    if(!backend.token) {
      return; // No change
    }
    backend.token = null;
    this.backendsStorageService.persistBackends();
    backend.createAccessRights();
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
          this.logoutFromBackend(backend);
        }});
  }

  /*
   * Retrieves endpoints for currently selected backend.
   */
  private getEndpoints(value: Backend) {
    this.httpClient.get<Endpoint[]>(value.url + '/magic/system/auth/endpoints').subscribe({
      next: (res) => {
        value.applyEndpoints(res || []);
      },
      error: (error: any) => console.error(error)
    });
  }
}
