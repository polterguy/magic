
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

/**
 * User model encapsulating a user from backend.
 */
 export class User {
  username: string;
  locked?: number; 
  created?: Date;
  role?: any; // In-app use only
  extra?: any; // In-app use only
}

export class UpdateUser {
  username: string;
  locked?: boolean; 
}

/**
 * Role model encapsulating a user's role from backend.
 */
export class Role {
  user: string;
  role: string
}

/**
 * Extra details model encapsulating a user's Extra details from backend.
 */
export class Extra {
  type: string;
  value: string;
  user: string
}

/**
 * Extra details model encapsulating a user's Extra details from backend.
 */
export class Roles {
  name: string;
  description: string;
}

/**
 * Create a new user's model.
 */
export class NewUser {
  username: string;
  password: string;
}

/**
 * Authentication and authorization service, allowing you to query your backend
 * for its users/roles/etc.
 */
@Injectable({
  providedIn: 'root',
})
export class UsersService {

  /**
   * Creates an instance of our object.
   *
   * @param httpClient HTTP client to use for HTTP invocations
   */
  constructor(private httpClient: HttpClient) { }

  /**
   * Invokes users's endpoint to fetch the list of users.
   * @param params QueryParameters.
   * @returns List of users.
   */
  users(params: string) {
    return this.httpClient.get<User[]>(
      environment.apiUrl +
      'magic/modules/magic/users' + params);
  }

  /**
   * Invokes users's endpoint to update a user.
   * @param params data.
   * @returns Result of the operation.
   */
  updateUser(data: UpdateUser) {
    return this.httpClient.put<UpdateUser>(
      environment.apiUrl +
      'magic/modules/magic/users', data);
  }

  /**
   * Invokes users's endpoint to create a new user.
   * @param params data.
   * @returns Result of the operation.
   */
  createUser(data: NewUser) {
    return this.httpClient.post<NewUser>(
      environment.apiUrl +
      'magic/modules/magic/users', data);
  }

  /**
   * Invokes users_count's endpoint to get the total number of users.
   * @param params queryParameters.
   * @returns Count of the users.
   */
  usersCount(params: string) {
    return this.httpClient.get<any>(
      environment.apiUrl +
      'magic/modules/magic/users-count' + params);
  }

  /**
   * Invokes users's endpoint to delete a user.
   * @param params queryParameters.
   * @returns Result of the operation.
   */
  deleteUser(params: string) {
    return this.httpClient.delete<User>(
      environment.apiUrl +
      'magic/modules/magic/users' + params);
  }

  /**
   * Invokes users_roles' endpoint to get all roles assigned to the user.
   * @param params queryParameters.
   * @returns list of roles assigned to the user.
   */
  getUserRole(params: string) {
    return this.httpClient.get<Role[]>(
      environment.apiUrl +
      'magic/modules/magic/users_roles' + params);
  }

  /**
   * Invokes users_roles' endpoint to add a new role.
   * @param params data.
   * @returns Result of the operation.
   */
  addUserRole(data: Role) {
    return this.httpClient.post<any>(
      environment.apiUrl +
      'magic/modules/magic/users_roles', data);
  }

  /**
   * Invokes users_roles' endpoint to remove a role from the user's roles.
   * @param params queryParameters.
   * @returns Result of the operation.
   */
  removeUserRole(params: string) {
    return this.httpClient.delete<any>(
      environment.apiUrl +
      'magic/modules/magic/users_roles' + params);
  }

  /**
   * Invokes users_extra's endpoint to get all details stored in extra field.
   * @param params queryParameters.
   * @returns List of extra details.
   */
  getUserExtras(params: string) {
    return this.httpClient.get<Extra[]>(
      environment.apiUrl +
      'magic/modules/magic/users_extra' + params);
  }

  /**
   * Invokes roles's endpoint to get the list of all available roles.
   * @returns List of roles.
   */
  getRoles() {
    return this.httpClient.get<Roles[]>(
      environment.apiUrl +
      'magic/modules/magic/roles');
  }

}
