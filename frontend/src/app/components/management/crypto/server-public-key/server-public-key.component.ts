
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';

// Application specific imports.
import { AuthService } from '../../../../services/auth.service';
import { MessageService } from 'src/app/services/message.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { CryptoService } from 'src/app/components/management/crypto/services/crypto.service';
import { PublicKeyFull } from 'src/app/components/management/crypto/models/public-key-full.model';
import { CreateKeypairDialogComponent } from './create-keypair-dialog/create-keypair-dialog.component';
import { BackendService } from 'src/app/services/backend.service';

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
  public publicKeyFull: PublicKeyFull = null;

  /**
   * Creates an instance of your component.
   * 
   * @param dialog Needed to show modal dialogs
   * @param authService Needed to check if user is root
   * @param cryptoService Service needed to retrieve server's public key
   * @param messageService Needed to publish message to subscribers as we create new server key pair
   * @param feedbackService Displays errors and such to user
   * @param clipboard Needed to copy URL of endpoint
   */
  constructor(
    private dialog: MatDialog,
    public authService: AuthService,
    private cryptoService: CryptoService,
    private messageService: MessageService,
    private backendService: BackendService,
    private feedbackService: FeedbackService,
    private clipboard: Clipboard) { }

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
    this.cryptoService.serverPublicKey().subscribe((key: any) => {

      // Verifying invocation was a success.
      if (key.result === 'FAILURE') {

        // No server key pair.
        this.feedbackService.showInfo('No server key pair found, please create one');
        return;
      }

      // Assigning model.
      this.publicKeyFull = <PublicKeyFull>key;
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

        /*
         * Publishing message to have other components understand they need to
        * re-retrieve publick keys.
        * 
        * This needs to be done since as we create a new server key pair, the public parts
        * of the key is also imported into the trusted public keys' database.
        */
       this.messageService.sendMessage({
         name: 'crypto.server.new-key-pair-generated'
       });
      }
    });
  }

  /**
   * Returns true if user is root.
   */
  public isRoot() {

    // Returning true if user belongs to the root role
    return this.backendService.current?.token?.in_role('root') || false;
  }

  /**
   * Invoked when user wants to copy the full URL of the endpoint.
   */
   public copyPublicKey() {

    // Copies the currently edited endpoint's URL prepended by backend root URL.
    this.clipboard.copy(this.publicKeyFull.publicKey);

    // Informing user that URL can be found on clipboard.
    this.feedbackService.showInfoShort('Public key was copied to your clipboard');
  }
}
