
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { CryptoService } from 'src/app/services/crypto.service';
import { PublicKeyFull } from 'src/app/models/public-key-full.model';

/**
 * Crypto component allowing you to administrate your server's cryptography keys.
 */
@Component({
  selector: 'app-crypto',
  templateUrl: './crypto.component.html',
  styleUrls: ['./crypto.component.scss']
})
export class CryptoComponent implements OnInit {

  /**
   * Server's public key information.
   */
  public publicKeyFull: PublicKeyFull;

  /**
   * Creates an instance of your component.
   * 
   * @param cryptoService Cryptography service needed to retrieve and update crypto items from your backend
   */
  constructor(private cryptoService: CryptoService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving server's public key.
    this.getServerPublicKey();
  }

  /**
   * Retrieves the server's public key.
   */
  public getServerPublicKey() {

    // Invoking backend to retrieve key.
    this.cryptoService.serverPublicKey().subscribe((key: PublicKeyFull) => {
      this.publicKeyFull = key;
    });
  }
}
