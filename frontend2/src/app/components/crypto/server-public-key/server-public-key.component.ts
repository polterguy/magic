
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { CryptoService } from 'src/app/services/crypto.service';
import { PublicKeyFull } from 'src/app/models/public-key-full.model';

/**
 * Component that shows server's public key.
 */
@Component({
  selector: 'app-server-public-key',
  templateUrl: './server-public-key.component.html',
  styleUrls: ['./server-public-key.component.scss']
})
export class ServerPublicKeyComponent implements OnInit {

  /**
   * Server's public key information.
   */
  public publicKeyFull: PublicKeyFull;

  /**
   * Creates an instance of your component.
   * 
   * @param cryptoService Service needed to retrieve server's public key
   */
  constructor(private cryptoService: CryptoService) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {

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
