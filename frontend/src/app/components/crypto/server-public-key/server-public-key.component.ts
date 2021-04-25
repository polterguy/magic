
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

// Application specific imports.
import { AuthService } from '../../auth/services/auth.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { CryptoService } from 'src/app/components/crypto/services/crypto.service';
import { PublicKeyFull } from 'src/app/components/crypto/models/public-key-full.model';
import { CreateKeypairDialogComponent } from './create-keypair-dialog/create-keypair-dialog.component';

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
   * @param dialog Needed to show modal dialogs
   * @param authService Needed to check if user is root
   * @param cryptoService Service needed to retrieve server's public key
   * @param feedbackService Displays errors and such to user
   */
  constructor(
    private dialog: MatDialog,
    private authService: AuthService,
    private cryptoService: CryptoService,
    private feedbackService: FeedbackService) { }

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

  /**
   * Invoked when user wants to create a new public key for his server.
   */
  public create() {

    // Showing modal dialog.
    const dialogRef = this.dialog.open(CreateKeypairDialogComponent, {
      width: '550px',
    });

    // Subscribing to closed event, and if given a filename, loads it and displays it in the Hyperlambda editor.
    dialogRef.afterClosed().subscribe((result: boolean) => {

      // If dialog generated a new key pair, it will return true.
      if (result) {

        // Success! Giving user some feedback, and reloading server key data.
        this.feedbackService.showInfo('A new server key pair was successfully generated. Your old key was backed up.');
        this.getServerPublicKey();
      }
    });
  }

  /**
   * Returns true if user is root.
   */
   public isRoot() {

    // Returning true if user belongs to the root role
    return this.authService.authenticated && this.authService.roles().filter(x => x === 'root');
  }
}
