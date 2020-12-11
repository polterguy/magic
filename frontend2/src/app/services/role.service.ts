
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { Role } from '../models/role.model';
import { HttpService } from './http.service';
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
}
