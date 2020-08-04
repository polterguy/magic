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

/*
 * Authentication and authorization service, allowing you to query your backend
 * for its users/roles/etc.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private httpClient: HttpClient) { }

  // Returns all users according to the specified filter condition.
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

  // Returns count of users according to the specified filter condition.
  getUsersCount(filter: string = null) {
    let query = '';
    if (filter !== null) {
      query += '?username.like=' + encodeURIComponent(filter + '%');
    }
    return this.httpClient.get<any>(
      environment.apiUrl +
      'magic/modules/magic/users-count' + query);
  }

  // Returns all roles according to the specified filter condition.
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

  // Returns count of roles according to the specified filter condition.
  getRolesCount(filter: string = null) {
    let query = '';
    if (filter !== null) {
      query += '?name.like=' + encodeURIComponent(filter + '%');
    }
    return this.httpClient.get<any>(
      environment.apiUrl +
      'magic/modules/magic/roles-count' + query);
  }

  // Creates a new user.
  createUser(username: string, password: string) {
    return this.httpClient.post<any>(environment.apiUrl + 'magic/modules/magic/users', {
      username,
      password,
    });
  }

  // Creates a new role.
  createRole(name: string, description?: string) {
    return this.httpClient.post<any>(environment.apiUrl + 'magic/modules/magic/roles', {
      name,
      description,
    });
  }

  // Deletes an existing user.
  deleteUser(username: string) {
    return this.httpClient.delete<any>(
      environment.apiUrl + 
      'magic/modules/magic/users?username=' + encodeURIComponent(username));
  }

  // Deletes an existing role.
  deleteRole(name: string) {
    return this.httpClient.delete<any>(
      environment.apiUrl + 
      'magic/modules/magic/roles?name=' + encodeURIComponent(name));
  }

  // Returns all roles that the specified user belongs to.
  getUserRoles(username: string) {
    return this.httpClient.get<any>(
      environment.apiUrl +
      'magic/modules/magic/users_roles?user.eq=' + encodeURIComponent(username));
  }

  // Adds a specified user to a specified role.
  addRoleToUser(user: string, role: string) {
    return this.httpClient.post<any>(environment.apiUrl + 'magic/modules/magic/users_roles', {
      user,
      role,
    });
  }

  // Removes a role fomr a user.
  deleteRoleFromUser(user: string, role: string) {
    return this.httpClient.delete<any>(
      environment.apiUrl + 
      'magic/modules/magic/users_roles?role=' + encodeURIComponent(role) +
      '&user=' + encodeURIComponent(user));
  }
}
