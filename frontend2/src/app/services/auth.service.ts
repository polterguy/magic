
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthenticateResponse } from '../models/authenticate-response.model';
import { Backend } from '../models/backend.model';
import { Endpoint } from '../models/endpoint.model';

/**
 * Authentication and authorisation HTTP service.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private backends: Backend[] = [];
  private curBackend: Backend = null;
  private endpoints: Endpoint[] = [];

  /**
   * Creates an instance of your service.
   * 
   * @param httpClient Dependency injected HTTP client
   */
  constructor(private httpClient: HttpClient) {

    let backends: Backend[];
    const storage = localStorage.getItem('backends');
    if (storage === null) {
      backends = environment.defaultBackends;
    } else {
      backends = <Backend[]>JSON.parse(storage);
    }
    this.backends = backends;
    if (this.backends.length > 0) {
      this.curBackend = this.backends[0];
      this.removeInvalidTokens();
      this.createRefreshJWTTimers();
      this.persistBackends();
    }
  }

  /**
   * Returns true if user is connected to a backend.
   */
  public get isConnected() {
    return !!this.curBackend && this.endpoints.length > 0;
  }

  /**
   * Returns true if user is authenticated towards backend.
   */
  public get isAuthenticated() {
    return this.isConnected && this.curBackend.token;
  }

  /**
   * Returns the currently used backend API URL.
   */
  public get currentBackend() {
    return this.curBackend;
  }

  /**
   * Authenticates user towards backend.
   * 
   * @param url Backend API URL
   * @param username Username
   * @param password Password
   * @param storePassword Whether or not passsword should be persisted into local storage
   */
  authenticate(
    url: string,
    username: string,
    password: string,
    storePassword: boolean) {

    // Returning new observer, chaining authentication and retrieval of endpoints.
    return new Observable<AuthenticateResponse>(observer => {

      // Sanity checking invocation
      if (!this.isConnected) {
        observer.error('Not connected to any backend, please choose or configure a backend before trying to authenticate');
        observer.complete();
      } else {

        // Authenticating user.
        this.httpClient.get<AuthenticateResponse>(
          url + '/magic/modules/system/auth/authenticate' +
          '?username=' + encodeURI(username) +
          '&password=' + encodeURI(password)).subscribe(auth => {

            // Persisting backend data.
            let backend: Backend = {
              url,
              username,
              token: auth.ticket,
              password: storePassword ? password : null,
            };
            const el = this.persistBackend(backend);
            this.createRefreshJWTTimer(el);

            // Retrieving endpoints for current backend.
            this.getEndpoints().subscribe(endpoints => {
              observer.next(auth);
              observer.complete();
            }, (error: any) => {
              observer.error(error);
              observer.complete();
            });

          }, (error: any) => {
            observer.error(error);
            observer.complete();
          });
        }
      });
  }

  /**
   * Retrieves endpoints for currently selected backend.
   */
  public getEndpoints() {

    // Returning new observer, chaining retrieval of endpoints and storing them locally.
    return new Observable<Endpoint[]>(observer => {
      this.httpClient.get<Endpoint[]>(
        this.currentBackend.url + '/magic/modules/system/endpoints/endpoints').subscribe(res => {
        this.endpoints = res;
        observer.next(res);
        observer.complete();
      }, error => {
        observer.error(error);
        observer.complete();
      });
    });
  }

  /**
   * Returns true if specified JWT token is expired.
   * 
   * @param token JWT token to check.
   */
  public isTokenExpired(token: string) {
    const exp = (JSON.parse(atob(token.split('.')[1]))).exp;
    const now = Math.floor(new Date().getTime() / 1000);
    return now >= exp;
  }

  // Private helper methods.

  /*
   * Persists specified backend into local storage.
   */
  private persistBackend(backend: Backend) {
    const existing = this.backends.filter(x => x.url === backend.url);
    let el: Backend = null;
    if (existing.length === 0) {
      this.backends.push(backend);
      el = backend;
    } else {
      el = existing[0];
      el.password = backend.password;
      el.username = backend.username;
      el.url = backend.url;
      el.token = backend.token;
    }
    this.persistBackends();
    return el;
  }

  /*
   * Persists all backends into local storage.
   */
  private persistBackends() {
    localStorage.setItem('backends', JSON.stringify(this.backends));
  }

  /*
   * Removes all tokens from all backends that are expired, and
   * makes sure all valid tokens invokes the refresh endpoint before
   * the token expires.
   */
  private removeInvalidTokens() {
    for (let idx = 0; idx < this.backends.length; idx++) {
      const el = this.backends[idx];
      if (el.token && this.isTokenExpired(el.token)) {
        el.token = null;
      }
    }
  }

  /*
   * Creates a refresh JWT token timer, that invokes the
   * refresh token endpoint to update it, just before it
   * expires.
   */
  private createRefreshJWTTimers() {
    for (let idx = 0; idx < this.backends.length; idx++) {
      this.createRefreshJWTTimer(this.backends[idx]);
    }
  }

  /*
   * Creates a refresh timer for a single backend's JWT token.
   */
  private createRefreshJWTTimer(el: Backend) {
    if (el.token && !this.isTokenExpired(el.token)) {
      const exp = (JSON.parse(atob(el.token.split('.')[1]))).exp;
      const now = Math.floor(new Date().getTime() / 1000);
      const delta = (exp - now) - 60; // One minute before expiration.
      setTimeout(() => {
        this.refreshJWTToken(el);
      }, Math.max(delta * 1000, 100));
    }
  }

  /*
   * Will refresh the JWT token for the specified backend.
   */
  private refreshJWTToken(backend: Backend) {
    this.httpClient.get<AuthenticateResponse>(
      backend.url + '/magic/modules/system/auth/refresh-ticket').subscribe(res => {
      backend.token = res.ticket;
      this.persistBackends();
      this.createRefreshJWTTimer(backend);
    }, () => {
      console.error('JWT token could not be refreshed');
      backend.token = null;
      this.persistBackends();
    });
  }
}
