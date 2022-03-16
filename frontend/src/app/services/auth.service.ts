
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

// Application specific imports.
import { HttpService } from './http.service';
import { Backend } from '../models/backend.model';
import { BackendService } from './backend.service';
import { Endpoint } from '../models/endpoint.model';
import { AccessModel } from '../models/access.model';
import { Messages } from 'src/app/models/messages.model';
import { Response } from 'src/app/models/response.model';
import { MessageService } from 'src/app/services/message.service';
import { AuthenticateResponse } from '../components/management/auth/models/authenticate-response.model';

/**
 * Authentication and authorization HTTP service.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Used to figure out if user is authorised to access URLs or not.
  private _endpoints: Endpoint[] = [];

  // Used to associate user with access rights on individual component level.
  private _access: AccessModel = {
    sql: {},
    crud: {},
    endpoints: {},
    files: {},
    bazar: {},
    auth: {},
    log: {},
    tasks: {},
    terminal: {},
    eval: {},
    diagnostics: {},
    sockets: {},
    config: {},
    crypto: {},
  };

  // To allow consumers to subscribe to authentication events.
  private _authenticated = new BehaviorSubject<boolean>(undefined);

  /**
   * To allow consumers to subscribe to authentication status changes.
   */
  public authenticatedChanged = this._authenticated.asObservable();

  /**
   * Returns access rights for user.
   */
  public get access() { return this._access; }

  /**
   * Returns true if endpoints have been initialised.
   */
  public get has_endpoints() { return this._endpoints && this._endpoints.length > 0; }

  /**
   * Creates an instance of your service.
   * 
   * @param httpClient Dependency injected HTTP client to handle (raw) HTTP requests, without backend dependencies
   * @param httpService Dependency injected HTTP service to handle HTTP requests
   * @param messageService Needed to transmit message when user logs out
   * @param backendService Dependency injected backend service to handle currently selected backends
   * @param router Needed to redirect to root URL if user for some reasons is no longer authenticated
   */
  constructor(
    private httpClient: HttpClient,
    private httpService: HttpService,
    private messageService: MessageService,
    private backendService: BackendService,
    private router: Router) { }

  /**
   * Returns true if user is authenticated towards backend.
   */
  public get authenticated() {
    return this.backendService.connected && !!this.backendService.current.token_raw;
  }

  /**
   * Returns true if user is authenticated as root.
   */
  public get isRoot() {
    return this.backendService.connected &&
      !!this.backendService.current.token_raw &&
      this.roles().filter(x => x === 'root').length > 0;
  }

  /**
   * Invokes specified backend to check if auto-auth has been turned on.
   * 
   * @param url URL of backend to check
   */
  public autoAuth(url: string) {
    return this.httpClient.get<Response>(url + '/magic/system/auth/auto-auth');
   }

  /**
   * Authenticates user towards current backend.
   * 
   * @param username Username
   * @param password Password
   * @param storePassword Whether or not passsword should be persisted into local storage
   */
  public login(
    username: string,
    password: string,
    storePassword: boolean) {

    // Returning new observer, chaining authentication and retrieval of endpoints.
    return new Observable<AuthenticateResponse>(observer => {

      // Creating QUERY parameters.
      let query = '';
      if (username && username !== '') {
        query += '?username=' + encodeURIComponent(username);
        query += '&password=' + encodeURIComponent(password);
      }

      // Authenticating user.
      this.httpService.get<AuthenticateResponse>(
        '/magic/system/auth/authenticate' + query, {

          /*
           * Notice, if we're doing Windows automatica authentication,
           * there will be given a username/password to this method, at which point
           * we'll have to make sure Angular passes in Windows credentials to endpoint.
           */
          withCredentials: query === '' ? true : false,

        }).subscribe((auth: AuthenticateResponse) => {

          // Persisting backend data.
          this.backendService.current = new Backend(this.backendService.current.url.replace(/\s/g, '').replace(/(\/)+$/,''), username, storePassword ? password : null,auth.ticket);

          // In case backend URL changed, we need to retrieve endpoints again.
          this.getEndpoints().subscribe((endpoints: Endpoint[]) => {

            // Assigning endpoints.
            this._endpoints = endpoints || [];

            // Creating access right object.
            this.createAccessRights();

            // Invoking next link in chain of observables.
            observer.next(auth);
            observer.complete();

            // Ensuring subscribers to authentication status is notified.
            this._authenticated.next(true);

          }, (error: any) => {
            observer.error(error);
            observer.complete();
          });
        }, (error: any) => {
          observer.error(error);
          observer.complete();
      });
    });
  }

  /**
   * Logs out the user from his currently active backend.
   * 
   * @param destroyPassword Whether or not password should be removed before persisting backend
   * @param showInfo Whether or not user should be shown information telling him he was successfully logged out or not
   */
  public logout(destroyPassword: boolean, showInfo: boolean = true) {
    if (this.authenticated) {
      this.backendService.current = new Backend(this.backendService.current.url, this.backendService.current.username, destroyPassword ? null : this.backendService.current.password, null);
      this.backendService.persistBackends();
      this.messageService.sendMessage({
        name: Messages.USER_LOGGED_OUT,
        content: showInfo,
      });
      this.createAccessRights();

      // Ensuring subscribers to authentication status is notified.
      this._authenticated.next(false);
    }
  }

  /**
   * Retrieves endpoints for currently selected backend.
   */
  public getEndpoints() {

    // Returning new observer, chaining retrieval of endpoints and storing them locally.
    return new Observable<Endpoint[]>(observer => {

      // Invoking backend.
      this.httpService.get<Endpoint[]>(
        '/magic/system/auth/endpoints').subscribe(res => {

        // Associating result to model.
        this._endpoints = res || [];

        // Creating authorisation object.
        this.createAccessRights();

        // Invoking next amongst observables
        observer.next(res);
        observer.complete();

      }, error => {
        observer.error(error);
        observer.complete();
        this.router.navigate(['']);
      });
    });
  }

  /**
   * Returns a list of all roles currently authenticated
   * user belongs to, if any.
   */
  public roles() {

    // Verifying user is authenticated, and returning empty array if not.
    if (!this.authenticated) {
      return <string[]>[];
    }

    // Parsing role field from JWT token, and splitting at ','.
    const payload = atob(this.backendService.current.token_raw.split('.')[1]);
    const roles = JSON.parse(payload).role;
    if (Array.isArray(roles)) {
      return <string[]>roles;
    }
    return <string[]>[roles];
  }

  /**
   * Returns true if user has general access to the specified component.
   * In order to have access to a component, user has to have access to all component URLs.
   * 
   * @param component Name of component to check if user has access to
   */
  public hasAccess(component: string) {

    // Retrieving roles, and all endpoints matching path for specific component.
    const userRoles = this.roles();
    const componentEndpoints = this._endpoints.filter(x => x.path.indexOf(component) >= 0);
    if (componentEndpoints.length === 0) {
      return false; // No URL matching component's URL.
    }

    // Looping through all endpoints for component, and verifying user has access to all of them.
    for (var idx of componentEndpoints) {

      // Checking that component requires authorisation.
      if (!idx.auth || idx.auth.length === 0) {
        continue;
      }

      // Checking if component allows anyone being authenticated.
      if (idx.auth.length === 1 && idx.auth[0] === '*' && this.authenticated) {
        continue;
      }

      // Verifying user belongs to at least one of the roles required to invoke endpoint.
      if (idx.auth.filter(x => userRoles.indexOf(x) >= 0).length === 0) {
        return false;
      }
    }

    /*
     * User belongs to at least one of the roles required to invoke all
     * endoints for specified component, or component does not require authorisation
     * to be invoked.
     */
    return true;
  }

  /**
   * Returns true if user has general access to the specified component.
   * In order to have access to a component, user has to have access to all component URLs.
   * 
   * @param url URL to check
   * @param verb HTTP verb to check
   */
  public canInvoke(url: string, verb: string) {

    // Retrieving roles, and all endpoints matching path for specific component.
    const userRoles = this.roles();
    const componentEndpoints = this._endpoints.filter(x => x.path === url && x.verb === verb);
    if (componentEndpoints.length === 0) {
      return false; // No URL matching component's URL.
    }

    // Getting single component endpoint URL/verb.
    const componentEndpoint = componentEndpoints[0];

    // Checking that component requires authorisation.
    if (!componentEndpoint.auth || componentEndpoint.auth.length === 0) {
      return true;
    }

    // Checking if component allows anyone being authenticated.
    if (componentEndpoint.auth.length === 1 && componentEndpoint.auth[0] === '*' && this.authenticated) {
      return true;
    }

    // Verifying user belongs to at least one of the roles required to invoke endpoint.
    if (componentEndpoint.auth.filter(x => userRoles.indexOf(x) >= 0).length === 0) {
      return false;
    }

    /*
     * User belongs to at least one of the roles required to invoke all
     * endoints for specified component, or component does not require authorisation
     * to be invoked.
     */
    return true;
  }

  /**
   * Changes currently logged in user's password.
   * 
   * @param password New password for user
   */
  public changePassword(password: string) {

    // Invoking backend returning observable to caller.
    return this.httpService.put<Response>('/magic/system/auth/change-password', {
      password
    });
  }

  /**
   * Verifies validity of token by invoking backend.
   */
  public verifyToken() {

    // Invokes backend and returns observable to caller.
    return this.httpService.get<Response>('/magic/system/auth/verify-ticket');
  }

  /**
   * Registers a new user in the backend.
   * 
   * @param username User's email address
   * @param password Password user selected
   * @param frontendUrl Frontend's URL to use as root URL for confirming email address
   */
  public register(
    username: string,
    password: string,
    frontendUrl: string) {

    // Invokes backend and returns observable to caller.
    return this.httpService.post<Response>(
      '/magic/system/auth/register', {
        username,
        password,
        frontendUrl,
      });
  }

  /**
   * Verifies validity of email address supplied during
   * registration by invoking backend.
   * 
   * @param username Username of user which is email address user supplied during registration
   * @param token Security token system generated for user to avoid user's registering other users' email addresses
   */
  public verifyEmail(username: string, token: string) {

    // Invokes backend and returns observable to caller.
    return this.httpService.post<Response>(
      '/magic/system/auth/verify-email', {
        username,
        token,
      });
  }

  /**
   * Invokes the backend to have a reset password email being sent to user.
   * 
   * @param username Username of user to generate the email for
   * @param frontendUrl URL of frontend to use to build reset-password email from
   */
  public sendResetPasswordEmail(username: string, frontendUrl: string) {

    // Invoking backend returning observable to caller.
    return this.httpService.post<Response>('/magic/system/auth/send-reset-password-link', {
      username,
      frontendUrl,
    });
  }

  /**
   * Creates access right object used to determine if user has access to specific parts of the app or not.
   */
  public createAccessRights() {
    this._access = {
      sql: {
        execute_access:
          this.canInvoke('magic/system/sql/connection-strings', 'get') &&
          this.canInvoke('magic/system/sql/databases', 'get') &&
          this.canInvoke('magic/system/sql/evaluate', 'post'),
        list_files: this.canInvoke('magic/system/sql/list-files', 'get'),
        save_file: this.canInvoke('magic/system/sql/save-file', 'put'),
      },
      crud: {
        generate_crud: this.canInvoke('magic/system/crudifier/crudify', 'post'),
        generate_sql: this.canInvoke('magic/system/crudifier/custom-sql', 'post'),
        generate_frontend: this.canInvoke('magic/system/crudifier/generate-frontend', 'post'),
      },
      endpoints: {
        view: this.canInvoke('magic/system/endpoints/list', 'get'),
        assumptions: this.canInvoke('magic/system/assumptions/list', 'get'),
        create_test: this.canInvoke('magic/system/assumptions/create', 'post'),
      },
      files: {
        list_files: this.canInvoke('magic/system/file-system/list-files', 'get') && this.canInvoke('magic/system/file-system/list-files-recursively', 'get'),
        list_folders: this.canInvoke('magic/system/file-system/list-folders', 'get') && this.canInvoke('magic/system/file-system/list-folders-recursively', 'get'),
        rename: this.canInvoke('magic/system/file-system/rename', 'post'),
        install: this.canInvoke('magic/system/file-system/install', 'put'),
        create_file: this.canInvoke('magic/system/file-system/file', 'put'),
        create_folder: this.canInvoke('magic/system/file-system/folder', 'put'),
        delete_folder: this.canInvoke('magic/system/file-system/folder', 'delete'),
        delete_file: this.canInvoke('magic/system/file-system/file', 'delete'),
        download_folder: this.canInvoke('magic/system/file-system/download-folder', 'get'),
      },
      bazar: {
        download_from_bazar: this.canInvoke('magic/system/bazar/download-from-bazar', 'post'),
        download_from_url: this.canInvoke('magic/system/bazar/download-from-url', 'post'),
        get_manifests: this.canInvoke('magic/system/bazar/app-manifests', 'get'),
      },
      auth: {
        view_users: this.canInvoke('magic/modules/magic/users', 'get') && this.canInvoke('magic/modules/magic/users-count', 'get') && this.canInvoke('magic/modules/magic/users_roles', 'get') && this.canInvoke('magic/modules/magic/users_roles-count', 'get'),
        view_roles: this.canInvoke('magic/modules/magic/roles', 'get'),
        create_user: this.canInvoke('magic/modules/magic/users', 'post'),
        create_role: this.canInvoke('magic/modules/magic/roles', 'post'),
        delete_user: this.canInvoke('magic/modules/magic/users', 'delete'),
        delete_role: this.canInvoke('magic/modules/magic/roles', 'delete'),
        update_user: this.canInvoke('magic/modules/magic/users', 'put'),
        update_role: this.canInvoke('magic/modules/magic/roles', 'put'),
        create_user_role: this.canInvoke('magic/modules/magic/users_roles', 'post'),
        delete_user_role: this.canInvoke('magic/modules/magic/users_roles', 'delete'),
        update_user_role: this.canInvoke('magic/modules/magic/users_roles', 'put'),
        impersonate: this.canInvoke('magic/system/auth/impersonate', 'get'),
        jail: this.canInvoke('magic/system/auth/imprison', 'put'),
      },
      log: {
        read: this.canInvoke('magic/system/log/count', 'get') && this.canInvoke('magic/system/log/get', 'get') && this.canInvoke('magic/system/log/list', 'get'),
        write: this.canInvoke('magic/system/log/log', 'post'),
      },
      tasks: {
        create: this.canInvoke('magic/system/tasks/create', 'post'),
        read: this.canInvoke('magic/system/tasks/count', 'get') && this.canInvoke('magic/system/tasks/get', 'get') && this.canInvoke('magic/system/tasks/list', 'get'),
        update: this.canInvoke('magic/system/tasks/update', 'post'),
        delete: this.canInvoke('magic/system/tasks/delete', 'delete') && this.canInvoke('magic/system/tasks/due/delete', 'delete'),
        addDue: this.canInvoke('magic/system/tasks/due/add', 'post'),
        deleteDue: this.canInvoke('magic/system/tasks/due/delete', 'delete'),
      },
      terminal: {
        execute: this.canInvoke('magic/system/terminal/command', 'socket') && this.canInvoke('magic/system/terminal/start', 'socket') && this.canInvoke('magic/system/terminal/stop', 'socket'),
      },
      eval: {
        execute: this.canInvoke('magic/system/evaluator/evaluate', 'post'),
      },
      diagnostics: {
        read_assumptions: this.canInvoke('magic/system/assumptions/list', 'get'),
        execute_test: this.canInvoke('magic/system/assumptions/execute', 'get'),
        list_cache: this.canInvoke('magic/system/cache/list', 'get') && this.canInvoke('magic/system/cache/count', 'get'),
        delete_cache: this.canInvoke('magic/system/cache/delete', 'delete') && this.canInvoke('magic/system/cache/empty', 'delete'),
      },
      sockets: {
        read: this.canInvoke('magic/system/sockets/count-users', 'get') && this.canInvoke('magic/system/sockets/list-users', 'get'),
        send: this.canInvoke('magic/system/sockets/publish', 'post'),
      },
      config: {
        load: this.canInvoke('magic/system/config/load', 'get'),
        save: this.canInvoke('magic/system/config/save', 'post'),
        delete_cache_item: this.canInvoke('magic/system/cache/delete', 'delete'),
      },
      crypto: {
        crypto_keys: this.canInvoke('magic/modules/magic/crypto_keys', 'get'),
        import_public_key: this.canInvoke('magic/system/crypto/import', 'post'),
        generate_server_key: this.canInvoke('magic/system/crypto/generate-keypair', 'post'),
        crypto_invocations: this.canInvoke('magic/modules/magic/crypto_invocations', 'get'),
        delete_public_key: this.canInvoke('magic/modules/magic/crypto_keys', 'delete'),
        save_public_key: this.canInvoke('magic/modules/magic/crypto_keys', 'put'),
      }
    };
  }

  updateAuthStatus(newStatus: boolean) {
    this._authenticated.next(newStatus);
  }
}
