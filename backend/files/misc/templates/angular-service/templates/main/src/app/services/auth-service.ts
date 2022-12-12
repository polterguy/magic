import { JwtHelperService } from '@auth0/angular-jwt';
import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { IUsers } from './interfaces/users-interface';
import { IRoles } from './interfaces/roles-interface';
import { AuthFilter } from './models/auth-filter';
import { Endpoint } from './models/endpoint';
import { AuthenticateToken } from './models/authenticate-token';
import { StatusResponse } from './models/status-response';
import { CreateResponse } from './models/create-response';
import { DeleteResponse } from './models/delete-response';
import { CountResponse } from './models/count-response';
import { IMe } from './interfaces/me-interface';

/**
 * Authentication and authorization service, allowing you to query your backend
 * for its users/roles/etc.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private endpoints: Endpoint[] = [];
  private userRoles: string[] = [];

  /**
   * Creates an instance of our object.
   * 
   * @param httpClient HTTP client to use for HTTP invocations
   * @param jwtHelper OAuth0 helper class to parse JWT tokens
   */
  constructor(
    private httpClient: HttpClient,
    private jwtHelper: JwtHelperService)
  {
    this.initialize();
  }

  /**
   * Returns true if endpoints have been initialized.
   * 
   * Do not initialize your app before this one returns true
   */
  public hasEndpoints() {
    return this.endpoints.length > 0;
  }

  /**
   * Returns method groups associated with the current user, allowing the user
   * to login, logout, change password, etc.
   */
  get me() : IMe {

    return {

      canInvoke: (url: string, verb: string) => {
        const endpoints = this.endpoints
          .filter((x: Endpoint) => x.path === url && x.verb === verb);

        if (endpoints.length === 0) {
          return false; // No such endpoint
        }
        return endpoints[0].auth === null ||
          endpoints[0].auth
            .filter(x => this.userRoles.includes(x)).length > 0;
      },
    
      inRole: (roles: string[]) => {
        return this.userRoles
          .filter(x => roles.indexOf(x) !== -1).length > 0;
      },
    
      isLoggedIn: () => {
        const ticket = localStorage.getItem('jwt_token');
        if (this.jwtHelper.isTokenExpired(ticket)) {
          localStorage.removeItem('jwt_token');
          return false;
        } else {
          return true;
        }
      },
    
      authenticate: (username: string, password: string) => {
        return new Observable<any>((observer: Subscriber<AuthenticateToken>) => {
          this.httpClient.get<AuthenticateToken>(
            environment.apiUrl +
            'magic/system/auth/authenticate?username=' +
            encodeURIComponent(username) +
            '&password=' +
            encodeURIComponent(password)).subscribe((res: any) => {
    
              // Success.
              localStorage.setItem('jwt_token', res.ticket);
              this.userRoles = this.jwtHelper.decodeToken(res.ticket).role.split(',');
              observer.next(res);
              observer.complete();
    
            }, (error: any) => {
    
              // Error.
              observer.error(error);
              observer.complete();
            });
          });
      },
    
      logout: () => {
        localStorage.removeItem('jwt_token');
        this.userRoles = [];
      },
    
      refreshTicket: () => {
        return this.httpClient.get<AuthenticateToken>(
          environment.apiUrl +
          'magic/system/auth/refresh-ticket');
      },
    
      changePassword: (password: string) => {
        return this.httpClient.put<StatusResponse>(
          environment.apiUrl +
          'magic/system/auth/change-password', {
          password,
        });
      }
    }
  }

  /**
   * Returns users method group, allowing you to create, read, count, and delete
   * users in your backend - In addition to retrieve, associate, and disassociate
   * users with roles.
   */
  get users() : IUsers {

    return {

      create: (username: string, password: string) => {
        return this.httpClient.post<CreateResponse>(
          environment.apiUrl +
          'magic/system/magic/users', {
            username,
            password,
        });
      },

      read: (filter: AuthFilter) => {
        let query = '';
        if (filter !== null) {
          query += '?limit=' + filter.limit;
          query += "&offset=" + filter.offset;
          if (filter.filter !== null &&
            filter.filter !== undefined &&
            filter.filter != '') {
            query += '&username.like=' + encodeURIComponent(filter.filter + '%');
          }
        }
        return this.httpClient.get<any[]>(
          environment.apiUrl +
          'magic/system/magic/users' + query);
      },

      count: (filter: string) => {
        let query = '';
        if (filter !== null) {
          query += '?username.like=' +
          encodeURIComponent(filter + '%');
        }
        return this.httpClient.get<CountResponse>(
          environment.apiUrl +
          'magic/system/magic/users-count' +
          query);
      },

      delete: (username: string) => {
        return this.httpClient.delete<DeleteResponse>(
          environment.apiUrl + 
          'magic/system/magic/users?username=' +
          encodeURIComponent(username));
      },

      roles: (username: string) => {
        return this.httpClient.get<any[]>(
          environment.apiUrl +
          'magic/system/magic/users_roles?user.eq=' +
          encodeURIComponent(username));
      },

      addRole: (user: string, role: string) => {
        return this.httpClient.post<CreateResponse>(
          environment.apiUrl +
          'magic/system/magic/users_roles', {
            user,
            role,
        });
      },

      deleteRole: (user: string, role: string) => {
        return this.httpClient.delete<DeleteResponse>(
          environment.apiUrl + 
          'magic/system/magic/users_roles?role=' +
          encodeURIComponent(role) +
          '&user=' +
          encodeURIComponent(user));
      }
    }
  }

  /**
   * Returns roles method group, allowing you to create, read, count, and delete
   * roles in your backend.
   */
  get roles() : IRoles {

    return {

      create: (name: string, description: string) => {
        return this.httpClient.post<CreateResponse>(
          environment.apiUrl +
          'magic/system/magic/roles', {
            name,
            description,
        });
      },

      read: (filter: AuthFilter) => {
        let query = '';
        if (filter !== null) {
          query += '?limit=' + filter.limit;
          query += "&offset=" + filter.offset;
          if (filter.filter !== null &&
            filter.filter !== undefined &&
            filter.filter != '') {
            query += '&name.like=' +
              encodeURIComponent(filter.filter + '%');
          }
        }
        return this.httpClient.get<any[]>(
          environment.apiUrl +
          'magic/system/magic/roles' + query);
      },

      count: (filter: string) => {
        let query = '';
        if (filter !== null) {
          query += '?name.like=' +
            encodeURIComponent(filter + '%');
        }
        return this.httpClient.get<CountResponse>(
          environment.apiUrl +
          'magic/system/magic/roles-count' + query);
      },

      delete: (name: string) => {
        return this.httpClient.delete<DeleteResponse>(
          environment.apiUrl + 
          'magic/system/magic/roles?name=' +
          encodeURIComponent(name));
      }
    }
  }

  /*
   * Invoked as object is created, which only happens once, since
   * service is consumed as a Singleton due to Angular's way of reusing
   * service instantiations.
   */
  private initialize() {

    /*
     * Checking JWT token is persisted, and not expired, at which point
     * we use stored token to initialize roles.
     */
    const ticket = localStorage.getItem('jwt_token');
    if (this.jwtHelper.isTokenExpired(ticket)) {
      localStorage.removeItem('jwt_token');
    } else {
      this.userRoles = this.jwtHelper.decodeToken(ticket).role.split(',');
    }

    /*
     * Retrieving endpoints from backend, which is a URL/verb association,
     * coupled with all roles allowed to invoke URL/verb combination.
     */
    this.httpClient.get<Endpoint[]>(
      environment.apiUrl + 
      'magic/system/auth/endpoints').subscribe((res: Endpoint[]) => {
        this.endpoints = res;
      }, (error: any) => {
        console.log(error);
      });
  }
}
