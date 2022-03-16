
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

import { Token } from "./token.model";

/**
 * Encapsulates a backend instance, in addition to its username, password, and if existing also
 * a currently active JWT token.
 */
export class Backend {

  private _token?: Token = null;

  constructor(url: string, username: string, password:string, token:string) {
    this.url = url;
    this.username = username;
    this.password = password;
    this._token = token ? new Token(token) : null;
  }

  /**
   * Backend's URL.
   */
  url: string;

  /**
   * Username used to authenticate user towards backend.
   */
  username?: string;

  /**
   * Password used to authenticate user towards backend.
   */
  password?: string;

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
    this._token = value;
  }

  /**
   * Refresh JWT timer for backend.
   */
  refreshTimer?: any;
}
  