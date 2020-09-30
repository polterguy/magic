import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

/*
 * Filter for invoking "auth" methods, allowing you to filter users/roles/etc.
 */
export class AuthFilter {
  filter?: string;
  offset: number;
  limit: number;
}

export class Endpoints {
  path: string;
  verb: string;
  auth: string[];
}

/*
 * Authentication and authorization service, allowing you to query your backend
 * for its users/roles/etc.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private httpClient: HttpClient) { }

  /**
   * Authenticates you towards your backend API.
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
    return this.httpClient.get<any>(environment.apiUrl + 'magic/modules/system/auth/refresh-ticket');
  }

  /**
   * Changes the password of the currently logged in user.
   * 
   * @param password New password to use for user
   */
  changeMyPassword(password: string) {
    return this.httpClient.put<any>(environment.apiUrl + 'magic/modules/system/auth/change-password', {
      password,
    });
  }

  /**
   * Returns all users according to the specified filter condition.
   * 
   * @param filter Filter declaring which users to retrieve
   */
  getUsers(filter: AuthFilter = null) {
    let query = '';
    if (filter !== null) {
      query += '?limit=' + filter.limit;
      query += "&offset=" + filter.offset;
      if (filter.filter !== null && filter.filter !== undefined && filter.filter != '') {
        query += '&username.like=' + encodeURIComponent(filter.filter + '%');
      }
    }
    return this.httpClient.get<any>(
      environment.apiUrl +
      'magic/modules/magic/users' + query);
  }

  /**
   * Returns count of all users according to the specified filter condition.
   * 
   * @param filter Filter declaring which users to count
   */
  getUsersCount(filter: string = null) {
    let query = '';
    if (filter !== null) {
      query += '?username.like=' + encodeURIComponent(filter + '%');
    }
    return this.httpClient.get<any>(
      environment.apiUrl +
      'magic/modules/magic/users-count' + query);
  }

  /**
   * Returns all roles according to the specified filter condition.
   * 
   * @param filter Filter declaring which users to return
   */
  getRoles(filter: AuthFilter = null) {
    let query = '';
    if (filter !== null) {
      query += '?limit=' + filter.limit;
      query += "&offset=" + filter.offset;
      if (filter.filter !== null && filter.filter !== undefined && filter.filter != '') {
        query += '&name.like=' + encodeURIComponent(filter.filter + '%');
      }
    }
    return this.httpClient.get<any>(
      environment.apiUrl +
      'magic/modules/magic/roles' + query);
  }


  /**
   * Returns count of all roles according to the specified filter condition.
   * 
   * @param filter Filter declaring which users to count
   */
  getRolesCount(filter: string = null) {
    let query = '';
    if (filter !== null) {
      query += '?name.like=' + encodeURIComponent(filter + '%');
    }
    return this.httpClient.get<any>(
      environment.apiUrl +
      'magic/modules/magic/roles-count' + query);
  }

  /**
   * Creates a new user in the system.
   * 
   * @param username Username for your new user
   * @param password Initial password for your new user
   */
  createUser(username: string, password: string) {
    return this.httpClient.post<any>(environment.apiUrl + 'magic/modules/magic/users', {
      username,
      password,
    });
  }

  /**
   * Creates a new role in the system.
   * 
   * @param name Name of role to create
   * @param description Description for your new role
   */
  createRole(name: string, description: string) {
    return this.httpClient.post<any>(environment.apiUrl + 'magic/modules/magic/roles', {
      name,
      description,
    });
  }

  /**
   * Deletes the specified user in your system.
   * 
   * @param username Username of user to delete
   */
  deleteUser(username: string) {
    return this.httpClient.delete<any>(
      environment.apiUrl + 
      'magic/modules/magic/users?username=' + encodeURIComponent(username));
  }

  /**
   * Deletes the specified role in your system.
   * 
   * @param name Name of role to delete
   */
  deleteRole(name: string) {
    return this.httpClient.delete<any>(
      environment.apiUrl + 
      'magic/modules/magic/roles?name=' + encodeURIComponent(name));
  }

  /**
   * Returns all roles the specified user belongs to.
   * 
   * @param username Username of roles to return
   */
  getUserRoles(username: string) {
    return this.httpClient.get<any>(
      environment.apiUrl +
      'magic/modules/magic/users_roles?user.eq=' + encodeURIComponent(username));
  }

  /**
   * Adds the specified user to the specified role.
   * 
   * @param user Username of user to add to specified role
   * @param role Role to add user to
   */
  addRoleToUser(user: string, role: string) {
    return this.httpClient.post<any>(environment.apiUrl + 'magic/modules/magic/users_roles', {
      user,
      role,
    });
  }

  /**
   * Removes the specified role from the specified user.
   * 
   * @param user Username of user to remove from specified role
   * @param role Role to remove from user
   */
  deleteRoleFromUser(user: string, role: string) {
    return this.httpClient.delete<any>(
      environment.apiUrl + 
      'magic/modules/magic/users_roles?role=' + encodeURIComponent(role) +
      '&user=' + encodeURIComponent(user));
  }

  /**
   * Returns all endpoints, associated with their URL, verb, and authorization
   * being a list of roles that are allowed to invoke the endpoint.
   */
  endpoints() {
    return this.httpClient.get<Endpoints[]>(
      environment.apiUrl + 
      'magic/modules/system/auth/endpoints');
  }
}
