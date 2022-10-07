
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Application specific imports.
import { Token } from './token.model';
import { Status } from './status.model';
import { Endpoint } from './endpoint.model';
import { AccessModel } from './access.model';

/**
 * Encapsulates a backend instance, in addition to its username, password, and if existing also
 * a currently active JWT token.
 */
export class Backend {

  private _token?: Token = null;
  private _url: string;
  private _username: string;
  private _password: string;
  private _status: Status = null;
  private _version: string = null;
  private _endpoints: Endpoint[] = [];
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
    cache: {},
    profile: false,
    fetched: false,
  };

  /**
   * Refresh JWT timer for backend.
   */
  refreshTimer?: any;

  /**
   * Creates an instance of your type.
   *
   * @param url URL to backend
   * @param username Username used to authenticate towards backend
   * @param password Password used to authenticate towards backend
   * @param token Existing JWT token used to access backend
   */
  constructor(url: string, username: string = null, password:string = null, token:string = null) {
    this._url = url.replace(/\s/g, '').replace(/(\/)+$/,'');
    this._username = username;
    this._password = password;
    if (token) {
      this.token = new Token(token);
    }
  }

  /**
   * Returns root URL for backend.
   */
  get url() : string {
    return this._url;
  }

  /**
   * Returns username used to authenticate towards backend.
   */
  get username() : string {
    return this._username;
  }

  /**
   * Changes username used to authenticate towards backend.
   */
  set username(value: string) {
    this._username = value;
  }

  /**
   * Returns password used to authenticate towards backend.
   */
  get password() : string {
    return this._password;
  }

  /**
   * Changes password used to authenticate towards backend.
   */
  set password(value: string) {
    this._password = value;
  }

  /**
   * Returns token for backend.
   */
  get token() : Token {
    return this._token;
  }

  /**
   * Sets the token for the backend.
   */
  set token(value: Token) {
    this._token = value?.expired ? null : value;
  }

  /**
   * Returns access rights for backend.
   */
  get access() {
    return this._access;
  }

  /**
   * Returns endpoints for backend.
   */
  get endpoints() {
    return this._endpoints;
  }

  /**
   * Returns the status of the backend, if known.
   */
  get status() : Status {
    return this._status;
  }

  /**
   * Changes the status of the backend.
   */
  set status(value: Status) {
    this._status = value;
  }

  /**
   * Returns true it setup is done.
   */
  get setupDone() {
    return this._status === null || (this._status.config_done && this._status.magic_crudified && this._status.server_keypair);
  }

  /**
   * Returns the version of the backend, if known.
   */
  get version() : string {
    return this._version;
  }

  /**
   * Changes the version of the backend.
   */
  set version(value: string) {
    this._version = value;
  }

  /**
   * Assigns the specified endpoints to the backend.
   *
   * @param endpoints Endpoints to assign
   */
  applyEndpoints(endpoints: Endpoint[]) {
    this._endpoints = endpoints;
    this.createAccessRights();
  }

  /*
   * Creates access right object used to determine if user has access to specific parts of the app or not.
   */
  createAccessRights() {
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
        execute: this.canInvoke('magic/system/diagnostics/has-terminal', 'get') && this.canInvoke('magic/system/terminal/command', 'socket') && this.canInvoke('magic/system/terminal/start', 'socket') && this.canInvoke('magic/system/terminal/stop', 'socket'),
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
      },
      cache: {
        read: this.canInvoke('magic/system/cache/list', 'get'),
        count: this.canInvoke('magic/system/cache/count', 'get'),
      },
      profile: !!this.token,
      fetched: true,
    };
  }

  /*
   * Private helper methods.
   */

  /*
   * Returns true if user has general access to the specified component.
   * In order to have access to a component, user has to have access to all component URLs.
   */
  private canInvoke(url: string, verb: string) {

    // Retrieving roles, and all endpoints matching path for specific component.
    const userRoles = this.token?.roles || [];
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
    if (componentEndpoint.auth.length === 1 && componentEndpoint.auth[0] === '*' && this.token) {
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
}
