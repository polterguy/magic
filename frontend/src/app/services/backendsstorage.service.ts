
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { Backend } from '../models/backend.model';
import { environment } from 'src/environments/environment';
import { Endpoint } from '../models/endpoint.model';

/**
 * Service containing list of all backends in the system.
 * 
 * Needed to avoid cyclical dependency in auth interceptor.
 */
@Injectable({
  providedIn: 'root'
})
export class BackendsStorageService {

  // Backends we are currently connected to.
  private _backends: Backend[] = [];

  /**
   * Creates an instance of your type.
   */
  constructor() {

    // Reading persisted backends from local storage, or defaulting to whatever is in our "environment.ts" file if we're on localhost.
    const storage = localStorage.getItem('magic.backends');
    const backends = storage === null ? (window.location.href.indexOf('://localhost') === -1 ? [] : environment.defaultBackends) : <any[]>JSON.parse(storage);
    this._backends = backends.map(x => new Backend(x.url, x.username, x.password, x.token));
  }

  /**
   * Returns the currently used backend.
   */
  get current() {
    return this._backends.length === 0 ? null : this._backends[0];
  }

  /**
   * Returns all backends.
   */
  get backends() {
    return this._backends;
  }

  /**
   * Sets the specified backend to the currently active backend, inserting backend if necessary.
   * Returns true if endpoints needs to be fetched for specified backend.
   * 
   * @param value Backend to set as active
   */
  setActive(value: Backend) {
    let endpoints: Endpoint[] = null;
    this._backends = [value].concat(this._backends.filter(x => {
      const isSame = x.url === value.url;
      if (isSame) {
        endpoints = x.endpoints; }
        if (x.refreshTimer) {
          clearTimeout(x.refreshTimer);
        }
      return !isSame;
    }));
    if (endpoints) {
      value.applyEndpoints(endpoints || []);
    }
    this.persistBackends();
    return endpoints === null && value.endpoints === null;
  }

  /**
   * Sets all backends.
   */
  set backends(value: Backend[]) {
    this._backends = value;
  }

  /**
   * Persists all backends into local storage.
   */
  persistBackends() {

    // Making sure we only persist non-null fields and that we do NOT persist "refreshTimer" field.
    const toPersist: any[] = [];
    for (const idx of this._backends) {
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
}
