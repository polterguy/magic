
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { User } from '../models/user.model';
import { Count } from '../../../models/count.model';
import { UserRoles } from '../models/user-roles.model';
import { Response } from 'src/app/models/response.model';
import { Affected } from '../../../models/affected.model';
import { HttpService } from '../../../services/http.service';
import { AuthFilter, createAuthQuery } from '../models/auth-filter.model';
import { AuthenticateResponse } from '../models/authenticate-response.model';

/**
 * User service, allowing you to administrate the users in your backend.
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {

  /**
   * Creates an instance of your service.
   * 
   * @param httpService HTTP service to use for backend invocations
   */
  constructor(private httpService: HttpService) { }

  /**
   * Returns a list of users from your backend.
   * 
   * @param filter Optional query filter deciding which items to return
   */
  public list(filter: AuthFilter = null) {

    // Invoking backend and returning observable.
    return this.httpService.get<User[]>('/magic/modules/magic/users' + createAuthQuery(filter, 'username'));
  }

  /**
   * Counts users in your backend.
   * 
   * @param filter Optional query filter deciding which items to count
   */
  public count(filter: AuthFilter = null) {

    // Dynamically building our query parameters.
    let query = '';
    if (filter !== null) {

      // Applying filter parts, if given.
      if (filter.filter && filter.filter !== '') {
        query += '?username.like=' + encodeURIComponent(filter.filter + '%');
      }
    }

    // Invoking backend and returning observable.
    return this.httpService.get<Count>('/magic/modules/magic/users-count' + query);
  }

  /**
   * Creates a new user in the system.
   * 
   * @param username Username for new user
   * @param password Initial password for user
   */
  public create(username: string, password: string) {

    // Invoking backend and returning observable.
    return this.httpService.post<any>('/magic/modules/magic/users', {
      username,
      password
    });
  }

  /**
   * Updates new user in the system.
   * 
   * @param user User to update
   */
  public update(user: User) {

    // Invoking backend and returning observable.
    return this.httpService.put<any>('/magic/modules/magic/users', {
      username: user.username,
      password: user.password,
      locked: user.locked,
    });
  }

  /**
   * Imprisons the specified user until the specified date, at
   * which point the user will be automatically unlocked, and given
   * back his usual access to Magic.
   * 
   * @param username Username of user you want to imprison
   * @param releaseDate Date and time for when user can access Magic again
   */
  public imprison(username: string, releaseDate: Date) {

    // Invoking backend and returning observable.
    return this.httpService.put<Response>('/magic/system/auth/imprison', {
      username,
      releaseDate,
    });
  }

  /**
   * Deletes the specified user from the backend.
   * 
   * @param username Username of user you want to delete
   */
  public delete(username: string) {

    // Invoking backend and returning observable.
    return this.httpService.delete<any>('/magic/modules/magic/users?username=' +
      encodeURIComponent(username));
  }

  /**
   * Returns all roles the specified user belongs to.
   * 
   * @param username Username of user to retrieve roles for
   */
  public getRoles(username: string) {

    // Invoking backend and returning observable.
    return this.httpService.get<UserRoles[]>('/magic/modules/magic/users_roles?user.eq=' +
      encodeURIComponent(username));
  }

  /**
   * Adds the specified user to the specified role.
   * 
   * @param user Username of user to add to role
   * @param role Name of role to add user to
   */
  public addRole(user: string, role: string) {

    // Invoking backend and returning observable.
    return this.httpService.post<Affected>('/magic/modules/magic/users_roles', {
      user,
      role,
    });
  }

  /**
   * Removes the specified role from the specified user.
   * 
   * @param user Username of user to remove role from
   * @param role Name of role to remove user from
   */
  public removeRole(user: string, role: string) {

    // Invoking backend and returning observable.
    return this.httpService.delete<Affected>('/magic/modules/magic/users_roles?user=' +
      encodeURIComponent(user) +
      '&role=' +
      encodeURIComponent(role));
  }

  /**
   * Creates a login link that can be used to authenticate as user.
   * 
   * @param username Username to generate login link on behalf of
   */
  public generateLoginLink(username: string) {
    return this.httpService.get<AuthenticateResponse>(
      '/magic/system/auth/generate-token?username=' +
      encodeURIComponent(username));
  }

  /**
   * Creates a login link that can be used by user to reset his or her password (only!).
   * 
   * @param username Username to generate login link on behalf of
   */
  public generateResetPasswordLink(username: string) {
    return this.httpService.get<AuthenticateResponse>(
      '/magic/system/auth/generate-token?username=' +
      encodeURIComponent(username) +
      '&reset-password=true');
  }
}
