
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { User } from '../models/user.model';
import { HttpService } from './http.service';
import { Count } from '../models/count.model';
import { AuthFilter } from '../models/auth-filter.model';

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

    // Dynamically building our query parameters.
    let query = '';
    if (filter !== null) {

      // Applying limit and offset
      query += '?limit=' + filter.limit;
      query += "&offset=" + filter.offset;

      // Applying filter parts, if given.
      if (filter.filter && filter.filter !== '') {
        query += '&username.like=' + encodeURIComponent(filter.filter + '%');
      }
    }

    // Invoking backend and returning observable.
    return this.httpService.get<User[]>('/magic/modules/magic/users' + query);
  }

  /**
   * Counts users in your backend.
   * 
   * @param filter Optional queery filter deciding which items to count
   */
  public count(filter: AuthFilter = null) {

    // Dynamically building our query parameters.
    let query = '';
    if (filter !== null) {

      // Applying filter parts, if given.
      if (filter.filter && filter.filter !== '') {
        query += '&username.like=' + encodeURIComponent(filter.filter + '%');
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
}
