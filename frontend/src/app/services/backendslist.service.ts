
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { Backend } from '../models/backend.model';
import { environment } from 'src/environments/environment';

/**
 * Service containing list of all backends in the system.
 * 
 * Needed to avoid cyclical dependency in auth interceptor.
 */
@Injectable({
  providedIn: 'root'
})
export class BackendsListService {

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
   * Sets all backends.
   */
  set backends(value: Backend[]) {
    this._backends = value;
  }
}
