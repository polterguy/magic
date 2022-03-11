
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { Backend } from '../models/backend.model';
import { environment } from 'src/environments/environment';

/**
 * Keeps track of your backend URLs and currently selected backends.
 * 
 * This service will store your backends in the local storage object,
 * to allow for easily selecting a backend you have previously connected to.
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
    const storage = localStorage.getItem('magic.backends');
    backends = storage === null ? (window.location.href.indexOf('://localhost') == -1 ? [] : environment.defaultBackends) : <Backend[]>JSON.parse(storage);
    this._backends = backends;

    // Checking we actually have any backends stored.
    if (this._backends.length > 0) {

      /*
       * Defaulting selected backend to whatever has a JWT token value,
       * since this was the previously selected backend user had selected.
       */
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
   * Removes specified backend from local storage and if it is the current 
   * backend changes the backend to the next available backend.
   * 
   * @param backend Backend to remove
   */
  public remove(backend: Backend) {
    const cur = this.current;
    this._backends = this._backends.filter(x => x.url !== backend.url);

    /*
     * Persisting all backends to local storage object,
     * and updating the currently selected backend.
     */
    this.persistBackends();
    this._current = this._backends.length > 0 ? this._backends[0] : null;
    return cur.url === backend.url;
  }

  /**
   * Sets the currently selected backend.
   */
  public set current(value: Backend) {

    /*
     * Checking to see if the backend exists from before,
     * and if it does we update its fields. If not, we append
     * a new backend to the list of backends we handle.
     */
    const existing = this._backends.filter(x => x.url === value.url);
    if (existing.length > 0) {

      // Updating existing backend's fields.
      existing[0].username = value.username;
      existing[0].password = value.password;
      existing[0].token = value.token;
      value = existing[0];

    } else {

      // Appending backend.
      this._backends.push(value);
    }

    /*
     * Making sure we sort backends such that the current backend
     * becomes the first in our list of backends, which makes sure
     * that if the user refreshes the browser, this is the backend
     * that will be used.
     */
    this._backends.sort((lhs: Backend, rhs: Backend) => {
      if (lhs.url === value.url) {
        return -1;
      }
      if (rhs.url === value.url) {
        return 1;
      }
      if (lhs.token) {
        return -1;
      }
      if (rhs.token) {
        return 1;
      }
      return 0;
    });

    /*
     * Persisting all backends to local storage object,
     * and updating the currently selected backend.
     */
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
    localStorage.setItem('magic.backends', JSON.stringify(this._backends));
  }

  /**
   * Returns true if specified JWT token is expired.
   * 
   * @param token Token to check
   */
  public isTokenExpired(token: string) {

    // Parsing expiration time from JWT token.
    const exp = (JSON.parse(atob(token.split('.')[1]))).exp;
    const now = Math.floor(new Date().getTime() / 1000);
    return now >= exp;
  }
}
