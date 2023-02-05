
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { User, User_Extra } from '../_models/user.model';
import { Count } from '../../../../../models/count.model';
import { UserRoles } from '../_models/user-roles.model';
import { Affected } from '../../../../../models/affected.model';
import { AuthenticateResponse } from '../_models/authenticate-response.model';
import { HttpService } from 'src/app/_general/services/http.service';
import { MagicResponse } from 'src/app/_general/models/magic-response.model';

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
  list(params: string) {
    return this.httpService.get<User[]>('/magic/system/magic/users' + params);
  }

  /**
   * Counts users in your backend.
   *
   * @param filter Optional query filter deciding which items to count
   */
  count(params: string) {
    return this.httpService.get<Count>('/magic/system/magic/users-count' + params);
  }

  /**
   * Creates a new user in the system.
   *
   * @param username Username for new user
   * @param password Initial password for user
   */
  create(username: string, password: string) {
    return this.httpService.post<any>('/magic/system/magic/users', {
      username,
      password
    });
  }

  /**
   * Updates new user in the system.
   *
   * @param user User to update
   */
  update(user: User) {
    return this.httpService.put<any>('/magic/system/magic/users', {
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
  imprison(username: string, releaseDate: Date) {
    return this.httpService.put<MagicResponse>('/magic/system/auth/imprison', {
      username,
      releaseDate,
    });
  }

  /**
   * Deletes the specified user from the backend.
   *
   * @param username Username of user you want to delete
   */
  delete(username: string) {
    return this.httpService.delete<any>('/magic/system/magic/users?username=' + encodeURIComponent(username));
  }

  /**
   * Returns all roles the specified user belongs to.
   *
   * @param username Username of user to retrieve roles for
   */
  getRoles(username: string) {
    return this.httpService.get<UserRoles[]>('/magic/system/magic/users_roles?user.eq=' + encodeURIComponent(username));
  }

  /**
   * Adds the specified user to the specified role.
   *
   * @param user Username of user to add to role
   * @param role Name of role to add user to
   */
  addRole(user: string, role: string) {
    return this.httpService.post<Affected>('/magic/system/magic/users_roles', {
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
  removeRole(user: string, role: string) {
    return this.httpService.delete<Affected>('/magic/system/magic/users_roles?user=' +
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
      '/magic/system/auth/impersonate?username=' +
      encodeURIComponent(username));
  }

  /**
   * Creates a login link that can be used by user to reset his or her password (only!).
   *
   * @param username Username to generate login link on behalf of
   */
  public generateResetPasswordLink(username: string) {
    return this.httpService.get<AuthenticateResponse>('/magic/system/auth/reset-password?username=' + encodeURIComponent(username));
  }

  /**
   * Retrieving extra details of each user.
   *
   * @param username Username of the user
   */
  public getUserExtra(username: string) {
    return this.httpService.get<User_Extra>('/magic/system/magic/users_extra?user.eq=' + encodeURIComponent(username));
  }

  /**
   * Deleting extra details of each user.
   *
   * @param type Type of the field to be deleted,
   * @param username Username of the user
   */
  public deleteExtra(type: string, username: string) {
    return this.httpService.delete<any>('/magic/system/magic/users_extra?type=' + encodeURIComponent(type) + '&user=' + encodeURIComponent(username));
  }

  /**
   * Deleting extra details of each user.
   *
   * @param extra Extra information
   */
  public editExtra(extra: User_Extra) {
    return this.httpService.put<any>('/magic/system/magic/users_extra', extra);
  }

  /**
   * Deleting extra details of each user.
   *
   * @param extra Extra information
   */
  public addExtra(extra: User_Extra) {
    return this.httpService.post<any>('/magic/system/magic/users_extra', extra);
  }
}
