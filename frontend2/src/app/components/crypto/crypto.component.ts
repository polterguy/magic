
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { Affected } from 'src/app/models/affected.model';
import { PublicKey } from 'src/app/models/public-key.model';
import { CryptoService } from 'src/app/services/crypto.service';
import { FeedbackService } from 'src/app/services/feedback.service';
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

  // List of log item IDs that we're currently viewing details for.
  private displayDetails: number[] = [];

  /**
   * Server's public key information.
   */
  public publicKeyFull: PublicKeyFull;

  /**
   * Public keys the table is currently databound towards.
   */
  public publicKeys: PublicKey[] = [];

  public displayedColumns: string[] = [
    'subject',
    'email',
    'delete',
  ];

  /**
   * Creates an instance of your component.
   * 
   * @param cryptoService Cryptography service needed to retrieve and update crypto items from your backend
   */
  constructor(
    private cryptoService: CryptoService,
    private feedbackService: FeedbackService) { }

  /**
   * Implementation of OnInit.
   */
  public ngOnInit() {

    // Retrieving server's public key.
    this.getServerPublicKey();

    // Retrieving initial keys to databind table towards.
    this.getKeys();
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

  /**
   * Returns public keys from backend.
   */
  public getKeys() {

    // Retrieving public keys from backend.
    this.cryptoService.publicKeys(null).subscribe((keys: PublicKey[]) => {
      this.publicKeys = keys;
    });
  }

  public shouldDisplayDetails(key: PublicKey) {

    // Returns true if we're currently displaying this particular item.
    return this.displayDetails.filter(x => x === key.id).length > 0;
  }

  public toggleDetails(key: PublicKey) {

    // Checking if we're already displaying details for current item.
    const idx = this.displayDetails.indexOf(key.id);
    if (idx !== -1) {

      // Hiding item.
      this.displayDetails.splice(idx, 1);
    } else {

      // Displaying item.
      this.displayDetails.push(key.id);
    }
  }

  /**
   * Deletes a public cryptography key from your backend.
   * 
   * @param event Click event, needed to stop propagation
   * @param key Public key to delete
   */
  public delete(event: any, key: PublicKey) {

    // Making sure the event doesn't propagate upwards, which would trigger the row click event.
    event.stopPropagation();

    // Asking user to confirm deletion of public key.
    this.feedbackService.confirm(
      'Please confirm delete operation',
      `Are you sure you want to delete the public key belonging to ${key.subject} - ${key.email}`,
      () => {

        // Invoking backend to delete public key.
        this.cryptoService.deletePublicKey(key.id).subscribe(() => {
          this.feedbackService.showInfoShort('Public key successfully deleted');
        });
    });
  }
}
