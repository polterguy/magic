
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

/**
 * User model encapsulating a user from backend.
 */
export class User {
  username: string;
  locked?: boolean;
  created?: Date;
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

  users() {
    return this.httpClient.get<User[]>(
      environment.apiUrl +
      'magic/modules/magic/users');
  }
}
