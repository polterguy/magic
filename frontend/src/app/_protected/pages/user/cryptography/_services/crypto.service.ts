
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { KeyPair } from '../_models/key-pair.model';
import { Count } from '../../../../../models/count.model';
import { PublicKey } from '../_models/public-key.model';
import { Affected } from '../../../../../models/affected.model';
import { Response } from '../../../../../models/response.model';
import { PublicKeyFull } from '../_models/public-key-full.model';
import { CryptoInvocation } from '../_models/crypto-invocations.model';
import { HttpService } from 'src/app/_general/services/http.service';

/**
 * Crypto service, allowing you to administrate your cryptography keys.
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
  serverPublicKey() {
    return this.httpService.get<PublicKeyFull>('/magic/system/crypto/public-key');
  }

  /**
   * Returns public keys from your backend.
   *
   * @param filter Filter for which keys to return
   */
  publicKeys(filter: any) {
    let query = '';
    if (filter !== null) {
      if (filter.key_id) {
        query += '?id.eq=' + encodeURIComponent(filter.key_id);
      } else {
        query += '?limit=' + filter.limit;
        query += '&offset=' + filter.offset;
        query += '&order=imported';
        query += '&direction=desc';
        if (filter.filter && filter.filter !== '') {
          query += '&operator=or';
          query += '&email.like=' + encodeURIComponent('%' + filter.filter + '%');
          query += '&subject.like=' + encodeURIComponent('%' + filter.filter + '%');
          query += '&fingerprint.eq=' + encodeURIComponent(filter.filter);
        }
      }
    }
    return this.httpService.get<PublicKey[]>('/magic/system/magic/crypto_keys' + query);
  }

  /**
   * Returns public keys from your backend.
   *
   * @param filter Filter for which keys to return
   */
  countPublicKeys(filter: any) {
    let query = '';
    if (filter !== null && filter.filter && filter.filter !== '') {
      query += '?operator=or';
      query += '&email.like=' + encodeURIComponent('%' + filter.filter + '%');
      query += '&subject.like=' + encodeURIComponent('%' + filter.filter + '%');
      query += '&fingerprint.eq=' + encodeURIComponent(filter.filter);
    }
    return this.httpService.get<Count>('/magic/system/magic/crypto_keys-count' + query);
  }

  /**
   * Deletes a public key from your backend.
   *
   * @param id Unique ID of public key to delete
   */
  deletePublicKey(id: number) {
    return this.httpService.delete<Affected>('/magic/system/magic/crypto_keys?id=' + id);
  }

  /**
   * Changes the enabled state of the specified key.
   *
   * @param id Key caller wants to change enabled state of
   * @param enabled Whether or not caller wants to enable or disable key
   */
  setEnabled(id: number, enabled: boolean) {
    return this.httpService.put<Affected>('/magic/system/magic/crypto_keys', {
      id,
      enabled
    });
  }

  /**
   * Saves the public key declaration by invoking backend.
   *
   * @param key Key caller wants to save
   */
  updatePublicKey(key: PublicKey) {
    const payload: any = {
      id: key.id,
      subject: key.subject,
      email: key.email,
      fingerprint: key.fingerprint,
      content: key.content,
      vocabulary: key.vocabulary,
      enabled: key.enabled,
    };
    if (key.domain && key.domain !== '') {
      payload.domain = key.domain;
    } else {
      payload.domain = null;
    }
    return this.httpService.put<Affected>('/magic/system/magic/crypto_keys', payload);
  }

  /**
   * Associates the specified public key with a user.
   *
   * @param keyId Key caller wants to associate with user.
   * @param username Username caller wants to associate with key.
   */
  associateWithUser(keyId: number, username: string) {
    return this.httpService.put<Response>('/magic/system/crypto/associate-user', {
      keyId,
      username
    });
  }

  /**
   * Returns the username of the user key is associated with, if any.
   *
   * @param keyId Key caller wants to retrieve association for.
   */
  getUserAssociation(keyId: number) {
    return this.httpService.get<Response>('/magic/system/crypto/user-association?keyId=' + keyId);
  }

  /**
   * Deletes any existing associations between a user and a public key.
   *
   * @param keyId Key caller wants to associate with user.
   */
  deleteUserAssociation(keyId: number) {
    return this.httpService.put<Response>('/magic/system/crypto/deassociate-user', {
      keyId,
    });
  }

  /**
   * Generates a cryptography key pair for your server.
   *
   * @param strength Strength of key pair to generate, typically 2048, 4096, or some other exponent of 2
   * @param seed Used to seed the CSRNG object
   * @param subject Identity to use for key, typically owner's full name
   * @param email Email address of key's owner
   * @param domain URL to associate the key with, typically the backend's root URL
   */
  generateKeyPair(
    strength: number,
    seed: string,
    subject: string,
    email: string,
    domain: string,
    username: string) {
    return this.httpService.post<KeyPair>('/magic/system/crypto/generate-keypair', {
      strength,
      seed,
      subject,
      email,
      domain,
      username,
    });
  }

  /**
   * Imports a public key.
   *
   * @param key Key caller wants to import
   */
  createPublicKey(key: PublicKey) {
    return this.httpService.post<Response>('/magic/system/magic/crypto_keys', {
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
   * Imports a public key into the system.
   *
   * @param subject Name of key owner
   * @param email Email of owner
   * @param domain Root domain of key's owner
   * @param content Actual public key content
   */
  importPublicKey(
    subject: string,
    email: string,
    domain: string,
    content: string) {
    return this.httpService.post<Response>('/magic/system/crypto/import', {
      subject,
      email,
      domain,
      content
    });
  }

  /**
   * Invokes server to find the fingerprint of a public key.
   *
   * @param key Key to retrieve fingerprint for
   */
  getFingerprint(key: string) {
    return this.httpService.get<Response>('/magic/system/crypto/get-fingerprint?key=' + encodeURIComponent(key));
  }

  /**
   * Returns cryptographically signed invocations from backend to caller.
   *
   * @param filter Filter for filtering which invocations to return
   */
  invocations(filter: any = null) {
    let query = '';
    if (filter !== null) {
      query += '?limit=' + filter.limit;
      query += '&offset=' + filter.offset;
      query += '&order=created';
      query += '&direction=desc';
      if (filter.filter) {
        if (filter.filter.filter && filter.filter.filter !== '') {
          query += '&request_id.like=' + encodeURIComponent('%' + filter.filter.filter + '%');
        }
        if (filter.filter.crypto_key && filter.filter.crypto_key !== -1) {
          query += '&crypto_key.eq=' + encodeURIComponent(filter.filter.crypto_key);
        }
      }
    }
    return this.httpService.get<CryptoInvocation[]>('/magic/system/magic/crypto_invocations' + query);
  }

  /**
   * Returns public keys from your backend.
   *
   * @param filter Filter for which keys to return
   */
  countInvocations(filter: any) {
    let query = '';
    if (filter.filter) {
      if (filter.filter.filter && filter.filter.filter !== '') {
        query += '?request_id.like=' + encodeURIComponent('%' + filter.filter.filter + '%');
      }
      if (filter.filter.crypto_key && filter.filter.crypto_key !== -1) {
        query += '?crypto_key.eq=' + encodeURIComponent(filter.filter.crypto_key);
      }
    }
    return this.httpService.get<Count>('/magic/system/magic/crypto_invocations-count' + query);
  }

  /**
   * Retrieves the long lasting JWT token and returns to caller.
   */
  getGithubKey(username: string, role: string, expires: string) {
    const param: string = `?username=${encodeURIComponent(username)}&role=${encodeURIComponent(role)}&expires=${encodeURIComponent(expires)}`
    return this.httpService.get<any>('/magic/system/auth/generate-key' + param);
  }
}
