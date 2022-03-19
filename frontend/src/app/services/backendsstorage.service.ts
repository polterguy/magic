
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { Backend } from '../models/backend.model';
import { Endpoint } from '../models/endpoint.model';
import { environment } from 'src/environments/environment';

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
    let backends: any[] = [];
    const storage = localStorage.getItem('magic.backends');
    if (storage) {
      backends = <any[]>JSON.parse(storage);
    } else if (window.location.href.indexOf('http://localhost') !== -1) {
      backends = environment.defaultBackends;
    }
    this._backends = backends.map(x => new Backend(x.url, x.username, x.password, x.token));
  }

  /**
   * Returns the currently used backend.
   */
  get active() {
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
   * 
   * @param value Backend to set as active
   * @returns True if endpoints needs to be fetched for specified backend.
   */
  upsertAndActivate(value: Backend) {
    let endpoints: Endpoint[] = null;
    this._backends = [value].concat(this._backends.filter(x => {
      const isSame = x.url === value.url;
      if (isSame) {
        endpoints = x.endpoints;
      }
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
   * Removes the specified backend.
   * 
   * @param value Backend to remove
   */
  remove(value: Backend) {
    if (value.refreshTimer) {
      clearTimeout(value.refreshTimer);
      value.refreshTimer = null;
    }
    const oldActive = this.active;
    this._backends = this._backends.filter(x => x.url !== value.url);
    this.persistBackends();
    return oldActive.url === value.url;
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
