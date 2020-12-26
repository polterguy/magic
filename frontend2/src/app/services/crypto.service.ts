
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from './http.service';
import { Count } from '../models/count.model';
import { Affected } from '../models/affected.model';
import { Response } from '../models/response.model';
import { PublicKey } from '../models/public-key.model';
import { PublicKeyFull } from '../models/public-key-full.model';

/**
 * Crypto service, allows you to administrate your cryptography keys.
 */
@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  /**
   * Creates an instance of your service.
   * 
   * @param httpService HTTP service to use for backend invocations
   */
  constructor(private httpService: HttpService) { }

  /**
   * Retrieves the public key from server and returns to caller.
   */
  public serverPublicKey() {

    // Invoking backend and returning observable to caller.
    return this.httpService.get<PublicKeyFull>(
      '/magic/modules/system/crypto/public-key');
  }

  /**
   * Returns public keys from your backend.
   * 
   * @param filter Filter for which keys to return
   */
  public publicKeys(filter: any) {

    // Dynamically building our query parameters.
    let query = '';
    if (filter !== null) {

      // Applying limit and offset
      query += '?limit=' + filter.limit;
      query += "&offset=" + filter.offset;

      // Applying filter parts, if given.
      if (filter.filter && filter.filter !== '') {
        query += '&email.like=%' + encodeURIComponent(filter.filter + '%');
      }
    }

    // Invoking backend and returning observable.
    return this.httpService.get<PublicKey[]>('/magic/modules/magic/crypto_keys' + query);
  }

  /**
   * Returns public keys from your backend.
   * 
   * @param filter Filter for which keys to return
   */
  public countPublicKeys(filter: any) {

    // Dynamically building our query parameters.
    let query = '';
    if (filter !== null && filter.filter && filter.filter !== '') {
      query += '?email.like=%' + encodeURIComponent(filter.filter + '%');
    }

    // Invoking backend and returning observable.
    return this.httpService.get<Count>('/magic/modules/magic/crypto_keys-count' + query);
  }

  /**
   * Deletes a public key from your backend.
   * 
   * @param id Unique ID of public key to delete
   */
  public deletePublicKey(id: number) {

    // Invoking backend and returning observable.
    return this.httpService.get<Affected>('/magic/modules/magic/crypto_keys?id=' + id);
  }

  /**
   * Saves the public key declaration by invoking backend.
   * 
   * @param key Key caller wants to save
   */
  public savePublicKey(key: PublicKey) {
    return this.httpService.put<Affected>('/magic/modules/magic/crypto_keys', {
      id: key.id,
      subject: key.subject,
      email: key.email,
      domain: key.domain,
      fingerprint: key.fingerprint,
      content: key.content,
      vocabulary: key.vocabulary,
      enabled: key.enabled,
    });
  }

  /**
   * Invokes server to find the fingerprint of a public key.
   * 
   * @param key Key to retrieve fingerprint for
   */
  public getFingerprint(key: string) {

    // Invoking backend and returning observable.
    return this.httpService.get<Response>(
      '/magic/modules/system/crypto/get-fingerprint?key=' +
      encodeURIComponent(key));
  }
}
