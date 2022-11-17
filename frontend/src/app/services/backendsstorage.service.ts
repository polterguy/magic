
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { Backend } from '../models/backend.model';
import { environment } from 'src/environments/environment';

/**
 * Service containing list of all backends in the system responsible for persisting
 * your backends and keeping track of usernames, passwords and tokens associated with
 * each of your backends.
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
   * Upserts the specified backend and returns true if backend was inserted, otherwise false.
   * 
   * @param value Backend to upsert
   * @returns True if backend was inserted, otherwise false.
   */
  upsert(value: Backend) {
    const existing = this._backends.filter(x => x.url === value.url);
    if (existing.length > 0) {
      existing[0].username = value.username;
      existing[0].password = value.password;
      existing[0].token = value.token;
    } else {
      this._backends.push(value);
    }
    this.persistBackends();
    return existing.length === 0;
  }

  /**
   * Activates the specified backend.
   * 
   * @param value Backend to activate
   */
  activate(value: Backend) {
    this._backends.sort((lhs, rhs) => {
      if (lhs.url === value.url) {
        return -1;
      } else if (rhs.url === value.url) {
        return 1;
      }
      return 0;
    });
    this.persistBackends();
    return this._backends[0];
  }

  /**
   * Removes the specified backend.
   * 
   * @param value Backend to remove
   */
  remove(value: Backend) {
    const removed = this._backends.splice(this._backends.indexOf(value), 1);
    if (removed.length === 0) {
      throw 'No such backend';
    }
    this.persistBackends();
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
