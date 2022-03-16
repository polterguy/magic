
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { Backend } from '../models/backend.model';

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
