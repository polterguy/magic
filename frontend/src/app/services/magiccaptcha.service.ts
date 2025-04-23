
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Injectable } from '@angular/core';

/**
 * Magic CAPTCHA service.
 */
@Injectable({
  providedIn: 'root'
})
export class MagicCaptcha {

  constructor() { }

  /**
   * Creates a new Magic CAPTCHA token and invokes the ready function when token is available.
   */
  async token(publicKey: string, ready: (token: string) => void) {

    const now = Date.now();
    const toHash = `${publicKey};` + now;
    let seed = 0;
    const trailing = '000';
    while (true) {
      const uIntArray = new TextEncoder().encode(toHash + ';' + seed);
      const array = await crypto.subtle.digest('SHA-256', uIntArray);
      const hashArray = Array.from(new Uint8Array(array));
      const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
      if (hashHex.endsWith(trailing)) {
        const token = hashHex + ';' + now + ';' + seed;
        ready(token);
        return;
      }
      seed += 1;
    }
  }
}
