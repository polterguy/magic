import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { IUsers } from './interfaces/users-interface';
import { IRoles } from './interfaces/roles-interface';
import { AuthFilter } from './models/auth-filter';
import { Endpoint } from './models/endpoint';
import { AuthenticateToken } from './models/authenticate-token';
import { StatusResponse } from './models/status-response';
import { CreateResponse } from './models/create-response';
import { DeleteResponse } from './models/delete-response';
import { CountResponse } from './models/count-response';

/**
 * Authentication and authorization service, allowing you to query your backend
 * for its users/roles/etc.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  /**
   * Creates an instance of our object.
   * 
   * @param httpClient HTTP client to use for HTTP invocations
   */
  constructor(private httpClient: HttpClient) { }

  /**
   * Returns all endpoints, associated with their URL, verb, and authorization
   * being a list of roles that are allowed to invoke the endpoint.
   */
  endpoints() {
    return this.httpClient.get<Endpoint[]>(
      environment.apiUrl + 
      'magic/modules/system/auth/endpoints');
  }

  /**
   * Authenticates user towards backend.
   * 
   * @param username Username to use during authentication process
   * @param password Password to use during authentication process
   */
  authenticate(username: string, password: string) {
    return this.httpClient.get<AuthenticateToken>(
      environment.apiUrl +
      'magic/modules/system/auth/authenticate?username=' +
      encodeURI(username) +
      '&password=' +
      encodeURI(password));
  }

  /**
   * Refreshes the JWT token of the currently authenticated user if possible.
   */
  refreshTicket() {
    return this.httpClient.get<AuthenticateToken>(
      environment.apiUrl +
      'magic/modules/system/auth/refresh-ticket');
  }

  /**
   * Changes the password of the currently logged in user.
   * 
   * @param password New password to use for user
   */
  changeMyPassword(password: string) {
    return this.httpClient.put<StatusResponse>(
      environment.apiUrl +
      'magic/modules/system/auth/change-password', {
      password,
    });
  }

  /**
   * Returns users method group, allowing you to create, read, count, and delete
   * users in your backend - In addition to retrieve, associate, and disassociate
   * users with roles.
   */
  get users() : IUsers {

    return {

      create: (username: string, password: string) => {
        return this.httpClient.post<CreateResponse>(
          environment.apiUrl +
          'magic/modules/magic/users', {
            username,
            password,
        });
      },

      read: (filter: AuthFilter) => {
        let query = '';
        if (filter !== null) {
          query += '?limit=' + filter.limit;
          query += "&offset=" + filter.offset;
          if (filter.filter !== null &&
            filter.filter !== undefined &&
            filter.filter != '') {
            query += '&username.like=' + encodeURIComponent(filter.filter + '%');
          }
        }
        return this.httpClient.get<any[]>(
          environment.apiUrl +
          'magic/modules/magic/users' + query);
      },

      count: (filter: string) => {
        let query = '';
        if (filter !== null) {
          query += '?username.like=' +
          encodeURIComponent(filter + '%');
        }
        return this.httpClient.get<CountResponse>(
          environment.apiUrl +
          'magic/modules/magic/users-count' +
          query);
      },

      delete: (username: string) => {
        return this.httpClient.delete<DeleteResponse>(
          environment.apiUrl + 
          'magic/modules/magic/users?username=' +
          encodeURIComponent(username));
      },

      roles: (username: string) => {
        return this.httpClient.get<any[]>(
          environment.apiUrl +
          'magic/modules/magic/users_roles?user.eq=' +
          encodeURIComponent(username));
      },

      addRole: (user: string, role: string) => {
        return this.httpClient.post<CreateResponse>(
          environment.apiUrl +
          'magic/modules/magic/users_roles', {
            user,
            role,
        });
      },

      deleteRole: (user: string, role: string) => {
        return this.httpClient.delete<DeleteResponse>(
          environment.apiUrl + 
          'magic/modules/magic/users_roles?role=' +
          encodeURIComponent(role) +
          '&user=' +
          encodeURIComponent(user));
      }
    }
  }

  /**
   * Returns roles method group, allowing you to create, read, count, and delete
   * roles in your backend.
   */
  get roles() : IRoles {

    return {

      create: (name: string, description: string) => {
        return this.httpClient.post<CreateResponse>(
          environment.apiUrl +
          'magic/modules/magic/roles', {
            name,
            description,
        });
      },

      read: (filter: AuthFilter) => {
        let query = '';
        if (filter !== null) {
          query += '?limit=' + filter.limit;
          query += "&offset=" + filter.offset;
          if (filter.filter !== null &&
            filter.filter !== undefined &&
            filter.filter != '') {
            query += '&name.like=' +
              encodeURIComponent(filter.filter + '%');
          }
        }
        return this.httpClient.get<any[]>(
          environment.apiUrl +
          'magic/modules/magic/roles' + query);
      },

      count: (filter: string) => {
        let query = '';
        if (filter !== null) {
          query += '?name.like=' +
            encodeURIComponent(filter + '%');
        }
        return this.httpClient.get<CountResponse>(
          environment.apiUrl +
          'magic/modules/magic/roles-count' + query);
      },

      delete: (name: string) => {
        return this.httpClient.delete<DeleteResponse>(
          environment.apiUrl + 
          'magic/modules/magic/roles?name=' +
          encodeURIComponent(name));
      }
    }
  }
}
