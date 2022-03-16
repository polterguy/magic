
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

import { Token } from "./token.model";

/**
 * Encapsulates a backend instance, in addition to its username, password, and if existing also
 * a currently active JWT token.
 */
export class Backend {

  private _token?: Token;
  private _url: string;
  private _username: string;
  private _password: string;

  /**
   * Creates an instance of your type.
   * 
   * @param url URL to backend
   * @param username Username used to authenticate towards backend
   * @param password Password used to authenticate towards backend
   * @param token Existing JWT token used to access backend
   */
  constructor(url: string, username: string = null, password:string = null, token:string = null) {
    this._url = url;
    this._username = username;
    this._password = password;
    this._token = token ? new Token(token) : null;
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
    this._token = value;
  }

  /**
   * Refresh JWT timer for backend.
   */
  refreshTimer?: any;
}
  