import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { IUsers } from './interfaces/users-interface';
import { IRoles } from './interfaces/roles-interface';
import { AuthFilter } from './models/auth-filter';
import { Endpoint } from './models/endpoint';

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
    return this.httpClient.get<any>(
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
    return this.httpClient.get<any>(
      environment.apiUrl +
      'magic/modules/system/auth/refresh-ticket');
  }

  /**
   * Changes the password of the currently logged in user.
   * 
   * @param password New password to use for user
   */
  changeMyPassword(password: string) {
    return this.httpClient.put<any>(
      environment.apiUrl +
      'magic/modules/system/auth/change-password', {
      password,
    });
  }

  /**
   * Returns users method group, allowing you to create, read, count, and delete
   * users in your backend.
   */
  get users() : IUsers {

    return {

      /**
       * Creates a new user in the system.
       * 
       * @param username Username for your new user
       * @param password Initial password for your new user
       */
      create: (username: string, password: string) => {
        return this.httpClient.post<any>(
          environment.apiUrl +
          'magic/modules/magic/users', {
            username,
            password,
        });
      },

      /**
       * Returns all users according to the specified filter condition.
       * 
       * @param filter Filter declaring which users to retrieve
       */
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
        return this.httpClient.get<any>(
          environment.apiUrl +
          'magic/modules/magic/users' + query);
      },

      /**
       * Returns count of all users according to the specified filter condition.
       * 
       * @param filter Filter declaring which users to count
       */
      count: (filter: string) => {
        let query = '';
        if (filter !== null) {
          query += '?username.like=' +
          encodeURIComponent(filter + '%');
        }
        return this.httpClient.get<any>(
          environment.apiUrl +
          'magic/modules/magic/users-count' +
          query);
      },

      /**
       * Deletes the specified user in your system.
       * 
       * @param username Username of user to delete
       */
      delete: (username: string) => {
        return this.httpClient.delete<any>(
          environment.apiUrl + 
          'magic/modules/magic/users?username=' +
          encodeURIComponent(username));
      },

      /**
       * Returns all roles the specified user belongs to.
       * 
       * @param username Username of roles to return
       */
      roles: (username: string) => {
        return this.httpClient.get<any>(
          environment.apiUrl +
          'magic/modules/magic/users_roles?user.eq=' +
          encodeURIComponent(username));
      },

      /**
       * Adds the specified user to the specified role.
       * 
       * @param user Username of user to add to specified role
       * @param role Role to add user to
       */
      addRole: (user: string, role: string) => {
        return this.httpClient.post<any>(
          environment.apiUrl +
          'magic/modules/magic/users_roles', {
            user,
            role,
        });
      },

      /**
       * Removes the specified role from the specified user.
       * 
       * @param user Username of user to remove from specified role
       * @param role Role to remove from user
       */
      deleteRole: (user: string, role: string) => {
        return this.httpClient.delete<any>(
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

      /**
       * Creates a new role in the system.
       * 
       * @param name Name of role to create
       * @param description Description for your new role
       */
      create: (name: string, description: string) => {
        return this.httpClient.post<any>(
          environment.apiUrl +
          'magic/modules/magic/roles', {
            name,
            description,
        });
      },

      /**
       * Returns all roles according to the specified filter condition.
       * 
       * @param filter Filter declaring which users to return
       */
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
        return this.httpClient.get<any>(
          environment.apiUrl +
          'magic/modules/magic/roles' + query);
      },

      /**
       * Returns count of all roles according to the specified filter condition.
       * 
       * @param filter Filter declaring which users to count
       */
      count: (filter: string) => {
        let query = '';
        if (filter !== null) {
          query += '?name.like=' +
            encodeURIComponent(filter + '%');
        }
        return this.httpClient.get<any>(
          environment.apiUrl +
          'magic/modules/magic/roles-count' + query);
      },

      /**
       * Deletes the specified role in your system.
       * 
       * @param name Name of role to delete
       */
      delete: (name: string) => {
        return this.httpClient.delete<any>(
          environment.apiUrl + 
          'magic/modules/magic/roles?name=' +
          encodeURIComponent(name));
      }
    }
  }
}
