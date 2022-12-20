
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { Role } from '../_models/role.model';
import { Count } from '../../../../../models/count.model';
import { Affected } from '../../../../../models/affected.model';
import { HttpService } from 'src/app/_general/services/http.service';

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
  list(params?: string) {
    return this.httpService.get<Role[]>('/magic/system/magic/roles' + (params ?? ''));
  }

  /**
   * Counts roles in your backend.
   *
   * @param filter Optional query filter deciding which items to count
   */
  count(params: string) {
    return this.httpService.get<Count>('/magic/system/magic/roles-count' + params);
  }

  /**
   * Creates a new role in the system.
   *
   * @param name Name of new role to create
   * @param description Description for role
   */
  create(name: string, description: string) {
    return this.httpService.post<any>('/magic/system/magic/roles', {
      name,
      description
    });
  }

  /**
   * Updates an existing role in the system.
   *
   * @param name Name of role to update
   * @param description Description for role
   */
  update(name: string, description: string) {
    return this.httpService.put<any>('/magic/system/magic/roles', {
      name,
      description
    });
  }

  /**
   * Deletes the specified role.
   *
   * @param name Name of role to delete
   */
  delete(name: string) {
    return this.httpService.delete<Affected>('/magic/system/magic/roles?name=' + encodeURIComponent(name));
  }

  /**
   * Counts numbers of users belonging to specified role.
   *
   * @param role Name of role to count users belonging to
   */
  countUsers(role: string) {
    return this.httpService.get<Count>('/magic/system/magic/users_roles-count?role.eq=' + encodeURIComponent(role));
  }
}
