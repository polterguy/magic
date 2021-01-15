
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { Count } from '../../../models/count.model';
import { PublicKey } from '../models/public-key.model';
import { Affected } from '../../../models/affected.model';
import { Response } from '../../../models/response.model';
import { HttpService } from '../../../services/http.service';
import { PublicKeyFull } from '../models/public-key-full.model';
import { CryptoInvocation } from '../models/crypto-invocations.model';

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
      query += '&offset=' + filter.offset;
      query += '&order=imported';
      query += '&direction=desc';

      // Applying filter parts, if given.
      if (filter.filter && filter.filter !== '') {
        query += '&operator=or';
        query += '&email.like=' + encodeURIComponent('%' + filter.filter + '%');
        query += '&subject.like=' + encodeURIComponent('%' + filter.filter + '%');
        query += '&fingerprint.eq=' + encodeURIComponent(filter.filter);
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
      query += '?operator=or';
      query += '&email.like=' + encodeURIComponent('%' + filter.filter + '%');
      query += '&subject.like=' + encodeURIComponent('%' + filter.filter + '%');
      query += '&fingerprint.eq=' + encodeURIComponent(filter.filter);
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
    return this.httpService.delete<Affected>('/magic/modules/magic/crypto_keys?id=' + id);
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
   * Imports a public key.
   * 
   * @param key Key caller wants to import
   */
  public importPublicKey(key: PublicKey) {
    return this.httpService.post<Response>('/magic/modules/magic/crypto_keys', {
      type: key.type,
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

  /**
   * Returns cryptographically signed invocations from backend to caller.
   * 
   * @param filter Filter for filtering which invocations to return
   */
  public invocations(filter: any = null) {

    // Dynamically building our query parameters.
    let query = '';
    if (filter !== null) {

      // Applying limit and offset
      query += '?limit=' + filter.limit;
      query += '&offset=' + filter.offset;
      query += '&order=created';
      query += '&direction=desc';

      // Applying filter parts, if given.
      if (filter.filter) {
        if (filter.filter.request_id && filter.filter.request_id !== '') {
          query += '&request_id.like=' + encodeURIComponent('%' + filter.filter.request_id + '%');
        }
        if (filter.filter.crypto_key && filter.filter.crypto_key !== -1) {
          query += '&crypto_key.eq=' + encodeURIComponent(filter.filter.crypto_key);
        }
      }
    }
  
    // Invoking backend and returning observable.
    return this.httpService.get<CryptoInvocation[]>('/magic/modules/magic/crypto_invocations' + query);
  }

  /**
   * Returns public keys from your backend.
   * 
   * @param filter Filter for which keys to return
   */
  public countInvocations(filter: any) {

    // Dynamically building our query parameters.
    let query = '';
    if (filter.filter) {
      if (filter.filter.request_id && filter.filter.request_id !== '') {
        query += '?request_id.like=' + encodeURIComponent('%' + filter.filter.request_id + '%');
        if (filter.filter.crypto_key && filter.filter.crypto_key !== -1) {
          query += '&crypto_key.eq=' + encodeURIComponent(filter.filter.crypto_key);
        }
      } else {
        if (filter.filter.crypto_key && filter.filter.crypto_key !== -1) {
          query += '?crypto_key.eq=' + encodeURIComponent(filter.filter.crypto_key);
        }
      }
    }

    // Invoking backend and returning observable.
    return this.httpService.get<Count>('/magic/modules/magic/crypto_invocations-count' + query);
  }

  /**
   * Evicts cache for public key on server.
   * 
   * @param key Key to evict cache for on server
   */
  public evictCacheForPublicKey(key: PublicKey) {
    return this.httpService.delete<Response>(
      '/magic/modules/system/config/delete-cache-item?id=' +
      encodeURIComponent('public-key.' + key.fingerprint));
  }
}
