
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

import { Buffer } from 'buffer';

/**
 * Wrapper class for a JWT token with helper methods to calculate expiration, etc.
 */
export class Token {

  private _token: string = null;
  private _username: string = null;
  private _roles: string[] = [];
  private _exp: number = null;

  /**
   * Creates an instance of your type.
   * 
   * @param value Raw JWT token
   */
  constructor(value: string) {

    this.token = value;
  }

  /**
   * Returns the raw JWT token.
   */
  get token() {

    return this._token;
  }

  /**
   * Sets the token and re-initialises instance.
   */
  set token(value: string) {

    // Parsing token and doing some basic sanity checking.
    const entities = value.split('.');
    if (entities.length !== 3) {
      throw 'Not a valid token';
    }
    const payloadJson = Buffer.from(entities[1], 'base64').toString('binary');
    const payload = JSON.parse(payloadJson);
    this._username = payload.name;
    this._roles = [];
    if (Array.isArray(payload.role)) {
      for (const idx of <string[]>payload.role) {
        this._roles.push(idx);
      }
    } else {
      this._roles.push(payload.role);
    }
    if (payload.exp) {
      this._exp = payload.exp;
    } else {
      this._exp = null;
    }
    this._token = value;
  }

  /**
   * Returns username token declares.
   */
  get username() {

    return this._username;
  }

  /**
   * Returns roles user belongs to.
   */
  get roles() {

    return this._roles;
  }

  /**
   * Returns "exp" value for token.
   */
  get exp() {

    return this._exp;
  }

  /**
   * Returns number of seconds from now that token will expire.
   */
  get expires_in() {

    const now = Math.floor(new Date().getTime() / 1000);
    return this.exp - now;
  }

  /**
   * Returns true if token is expired.
   */
  get expired() {

    return this._exp !== null && this.expires_in <= 0;
  }

  /**
   * Returns true if user belongs to specified role.
   * 
   * @param value Role to check for
   * @returns True if user belongs to specified role
   */
  in_role(value: string) {

    return this.roles.includes(value);
  }
}
