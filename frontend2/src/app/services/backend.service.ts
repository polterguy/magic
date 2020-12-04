
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { Backend } from '../models/backend.model';
import { environment } from 'src/environments/environment';

/**
 * Keeps track of your backend URLs.
 */
@Injectable({
  providedIn: 'root'
})
export class BackendService {

  private _backends: Backend[] = [];
  private _current: Backend = null;

  /**
   * Creates an instance of your service.
   */
  constructor() {

    // Reading persisted backends from local storage, or defaulting to whatever is in our environment.ts file.
    let backends: Backend[];
    const storage = localStorage.getItem('backends');
    backends = storage === null ?
      environment.defaultBackends :
      backends = <Backend[]>JSON.parse(storage);
    this._backends = backends;

    // Checking we actually have any backends stored.
    if (this._backends.length > 0) {

      // Defaulting selected backend to whatever has a JWT token value, since this was the previously selected backend.
      const tmp = this._backends.filter(x => x.token !== null);
      this._current = tmp.length > 0 ? tmp[0] : this._backends[0];
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
   * Sets the currently selected backend.
   */
  public set current(value: Backend) {

    // Checking to see if the backend exists from before, and if so, updating its fields.
    const existing = this._backends.filter(x => x.url === value.url);
    if (existing.length > 0) {

      // Updating existing backend's fields.
      existing[0].url = value.url;
      existing[0].username = value.username;
      existing[0].password = value.password;
      existing[0].token = value.token;

    } else {

      // Appending backend.
      this._backends.push(value);
    }
    this.persistBackends();
    this._current = value;
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
    localStorage.setItem('backends', JSON.stringify(this._backends));
  }
}
