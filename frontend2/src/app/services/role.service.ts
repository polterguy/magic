
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { Role } from '../models/role.model';
import { HttpService } from './http.service';
import { Count } from '../models/count.model';
import { Affected } from '../models/affected.model';
import { AuthFilter } from '../models/auth-filter.model';

/**
 * User service, allowing you to administrate the users in your backend.
 */
@Injectable({
  providedIn: 'root'
})
export class RoleService {

  /**
   * Creates an instance of your service.
   * 
   * @param httpService HTTP service to use for backend invocations
   */
  constructor(private httpService: HttpService) { }

  /**
   * Returns a list of roles from your backend.
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
        query += '&name.like=' + encodeURIComponent(filter.filter + '%');
      }
    }

    // Invoking backend and returning observable.
    return this.httpService.get<Role[]>('/magic/modules/magic/roles' + query);
  }

  /**
   * Creates a new role in the system.
   * 
   * @param name Name of new role to create
   * @param description Description for rolw
   */
  public create(name: string, description: string) {

    // Invoking backend and returning observable.
    return this.httpService.post<any>('/magic/modules/magic/roles', {
      name,
      description
    });
  }

  /**
   * Deletes the specified role.
   * 
   * @param name Name of role to delete
   */
  public delete (name: string) {
    return this.httpService.delete<Affected>('/magic/modules/magic/roles?name=' +
      encodeURIComponent(name));
  }

  /**
   * Counts numbers of users belonging to specified role.
   * 
   * @param role Name of role to count users belonging to
   */
  public countUsers(role: string) {
    return this.httpService.get<Count>('/magic/modules/magic/users_roles-count?role.eq=' +
      encodeURIComponent(role));
  }
}
