
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private httpClient: HttpClient) { }

  list(filter: string = null) {
    const like = filter === null ? '' : '?username.like=' + encodeURIComponent('%' + filter + '%');
    return this.httpClient.get<any>(
      environment.apiURL +
      'magic/modules/magic_auth/users' + like);
  }

  createUser(username: string, password: string) {
    return this.httpClient.post<any>(environment.apiURL + 'magic/modules/magic_auth/users', {
      username
    });
  }

  getRoles(username: string) {
    return this.httpClient.get<any>(
      environment.apiURL +
      'magic/modules/magic_auth/users_roles?user.eq=' + encodeURIComponent(username));
  }
}
