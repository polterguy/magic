
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
  private currentBackend: Backend = null;
  private endpoints: Endpoint[] = [];

  /**
   * Creates an instance of your service.
   * 
   * @param httpClient Dependency injected HTTP client
   */
  constructor(private httpClient: HttpClient) {

    // Checking local storage if we've previously persisted backend API URLs.
    let backends: Backend[];
    const storage = localStorage.getItem('backends');
    if (storage === null) {
      // No previously stored backends.
      backends = environment.defaultBackends;
    } else {
      // Parsing previously stored backends from local storage.
      backends = <Backend[]>JSON.parse(storage);
    }
    this.backends = backends;
    this.currentBackend = this.backends[0];
  }

  /**
   * Returns true if user is authenticated towards backend.
   */
  get authenticated() {
    return this.currentBackend.token !== null;
  }

  /**
   * Returns the currently used backend API URL.
   */
  get backendUrl() {
    return this.currentBackend.url;
  }

  /**
   * Authenticates user towards backend.
   * 
   * @param username Username
   * @param password Password
   */
  authenticate(
    url: string,
    username: string,
    password: string,
    storePassword: boolean) {

    // Returning new observer, chaining authentication and retrieval of endpoints.
    return new Observable<AuthenticateResponse>(observer => {

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
          this.persistBackend(backend);

          // Retrieving endpoints for current backend.
          this.getEndpoints().subscribe(endpoints => {
            this.endpoints = endpoints;
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
      });
  }

  /*
   * Private helper method to retrieve endpoints for currently selected backend.
   */
  private getEndpoints() {
    return this.httpClient.get<Endpoint[]>(this.backendUrl + '/magic/modules/system/endpoints/endpoints');
  }

  /*
   * Persists specified backend into local storage.
   */
  private persistBackend(backend: Backend) {
    const existing = this.backends.filter(x => x.url === backend.url);
    if (existing.length === 0) {
      this.backends.push(backend);
    } else {
      const el = existing[0];
      el.password = backend.password;
      el.username = backend.username;
      el.url = backend.url;
      el.token = backend.token;
    }
    localStorage.setItem('backends', JSON.stringify(this.backends));
  }
}
