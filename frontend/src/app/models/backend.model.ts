
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
    this.token_raw = token;
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
   * JWT token as returned from backend during authentication.
   */
  get token_raw() : string {
    return this._token?.token ?? null;
  }

  /**
   * Updates the JWT token for backend.
   */
  set token_raw(value: string) {
    if (value === null) {
      this._token = null;
    } else {
      this._token = new Token(value);
    }
  }

  /**
   * Returns token for backend.
   */
  get token() : Token {
    return this._token;
  }

  /**
   * Refresh JWT timer for backend.
   */
  refreshTimer?: any;
}
  