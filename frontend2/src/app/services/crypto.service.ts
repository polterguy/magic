
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Injectable } from '@angular/core';

// Application specific imports.
import { HttpService } from './http.service';
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
}
