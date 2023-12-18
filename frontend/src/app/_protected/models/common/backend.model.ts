
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Application specific imports.
import { MagicResponse } from 'src/app/_general/models/magic-response.model';
import { Token } from './token.model';

/**
 * Encapsulates a backend instance, in addition to its username, password, and if existing also
 * a currently active JWT token.
 */
export class Backend {

  private _token?: Token = null;
  private _url: string;
  private _username: string;
  private _password: string;
  private _status: MagicResponse = null;
  private _version: string = null;

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
  constructor(url: string, username: string = null, password: string = null, token: string = null) {

    this._url = url.replace(/\s/g, '').replace(/(\/)+$/, '');
    this._username = username;
    this._password = password;
    if (token) {
      this.token = new Token(token);
    }
  }

  /**
   * Returns root URL for backend.
   */
  get url() {

    return this._url;
  }

  /**
   * Returns username used to authenticate towards backend.
   */
  get username() {

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
  get password() {

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
  get token() {

    return this._token;
  }

  /**
   * Sets the token for the backend.
   */
  set token(value: Token) {

    this._token = value?.expired ? null : value;
  }

  /**
   * Returns the status of the backend, if known.
   */
  get status() {

    return this._status;
  }

  /**
   * Changes the status of the backend.
   */
  set status(value: MagicResponse) {

    this._status = value;
  }

  /**
   * Returns true it setup is done.
   */
  get setupDone() {

    return this._status === null || this._status.result;
  }

  /**
   * Returns the version of the backend, if known.
   */
  get version() {

    return this._version;
  }

  /**
   * Changes the version of the backend.
   */
  set version(value: string) {

    this._version = value;
  }
}
