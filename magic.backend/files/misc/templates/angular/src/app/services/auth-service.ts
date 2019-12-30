
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export class AuthFilter {
  filter?: string;
  offset: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private httpClient: HttpClient) { }

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
      'magic/modules/magic_auth/users' + query);
  }

  getUsersCount(filter: string = null) {
    let query = '';
    if (filter !== null) {
      query += '?username.like=' + encodeURIComponent(filter + '%');
    }
    return this.httpClient.get<any>(
      environment.apiUrl +
      'magic/modules/magic_auth/users-count' + query);
  }

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
      'magic/modules/magic_auth/roles' + query);
  }

  getRolesCount(filter: string = null) {
    let query = '';
    if (filter !== null) {
      query += '?name.like=' + encodeURIComponent(filter + '%');
    }
    return this.httpClient.get<any>(
      environment.apiUrl +
      'magic/modules/magic_auth/roles-count' + query);
  }

  createUser(username: string, password: string) {
    return this.httpClient.post<any>(environment.apiUrl + 'magic/modules/magic_auth/users', {
      username,
      password,
    });
  }

  createRole(name: string, description?: string) {
    return this.httpClient.post<any>(environment.apiUrl + 'magic/modules/magic_auth/roles', {
      name,
      description,
    });
  }

  deleteUser(username: string) {
    return this.httpClient.delete<any>(
      environment.apiUrl + 
      'magic/modules/magic_auth/users?username=' + encodeURIComponent(username));
  }

  deleteRole(name: string) {
    return this.httpClient.delete<any>(
      environment.apiUrl + 
      'magic/modules/magic_auth/roles?name=' + encodeURIComponent(name));
  }

  getUserRoles(username: string) {
    return this.httpClient.get<any>(
      environment.apiUrl +
      'magic/modules/magic_auth/users_roles?user.eq=' + encodeURIComponent(username));
  }

  addRoleToUser(user: string, role: string) {
    return this.httpClient.post<any>(environment.apiUrl + 'magic/modules/magic_auth/users_roles', {
      user,
      role,
    });
  }

  deleteRoleFromUser(user: string, role: string) {
    return this.httpClient.delete<any>(
      environment.apiUrl + 
      'magic/modules/magic_auth/users_roles?role=' + encodeURIComponent(role) +
      '&user=' + encodeURIComponent(user));
  }
}
