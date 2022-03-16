
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Application specific imports.
import { Token } from '../models/token.model';
import { Backend } from '../models/backend.model';
import { Endpoint } from '../models/endpoint.model';
import { BackendsListService } from './backendslist.service';
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

  /**
   * Creates an instance of your service.
   * 
   * @httpClient Needed to refresh JWT token for backends
   * @backendsListService List of all backends in system
   */
  constructor(
    private httpClient: HttpClient,
    private backendsListService: BackendsListService) {

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
  setActive(value: Backend) {

    // Inserting specified backend as first instance and removing any backend with the same URL.
    let endpoints: Endpoint[] = null;
    this.backendsListService.backends = [value].concat(this.backendsListService.backends.filter(x => {
      const isSame = x.url === value.url;
      if (isSame) { if (x.refreshTimer) { clearTimeout(x.refreshTimer); } endpoints = x.endpoints; }
      return !isSame;
    }));

    // Persisting all backends to local storage object.
    this.persistBackends();
    this.ensureRefreshJWTTokenTimer(this.current);

    // Reusing endpoints if possible.
    if (endpoints) {
      value.applyEndpoints(endpoints || []);
    } else {
      this.getEndpoints();
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
    this.persistBackends();
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
   * Persists all backends into local storage.
   */
  private persistBackends() {

    // Making sure we only persist non-null fields and that we do NOT persist "refreshTimer" field.
    const toPersist: any[] = [];
    for (const idx of this.backendsListService.backends) {
      var idxPersist: any = {
        url: idx.url,
      };
      if (idx.username) {
        idxPersist.username = idx.username;
      }
      if (idx.password) {
        idxPersist.password = idx.password;
      }
      if (idx.token && !idx.token.expired) {
        idxPersist.token = idx.token.token;
      }
      toPersist.push(idxPersist);
    }
    localStorage.setItem('magic.backends', JSON.stringify(toPersist));
  }

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
        this.persistBackends();

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
        this.persistBackends();

        // Making sure we're able to refresh again once it's time.
        this.ensureRefreshJWTTokenTimer(backend);
        
      }, (error: any) => console.error(error));
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
