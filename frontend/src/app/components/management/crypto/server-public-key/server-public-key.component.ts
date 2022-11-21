
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatDialog } from '@angular/material/dialog';

// Application specific imports.
import { MessageService } from 'src/app/services--/message.service';
import { BackendService } from 'src/app/services--/backend.service--';
import { FeedbackService } from 'src/app/services--/feedback.service';
import { CryptoService } from 'src/app/components/management/crypto/services/crypto.service';
import { PublicKeyFull } from 'src/app/components/management/crypto/models/public-key-full.model';
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
  publicKeyFull: PublicKeyFull = null;

  /**
   * Creates an instance of your component.
   *
   * @param dialog Needed to show modal dialogs
   * @param cryptoService Service needed to retrieve server's public key
   * @param messageService Needed to publish message to subscribers as we create new server key pair
   * @param backendService Needed to determine access rights for user in backend
   * @param feedbackService Displays errors and such to user
   * @param clipboard Needed to copy URL of endpoint
   */
  constructor(
    private dialog: MatDialog,
    private cryptoService: CryptoService,
    private messageService: MessageService,
    public backendService: BackendService,
    private feedbackService: FeedbackService,
    private clipboard: Clipboard) { }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.getServerPublicKey();
  }

  /**
   * Invoked when user wants to create a new public key for his server.
   */
  create() {
    const dialogRef = this.dialog.open(CreateKeypairDialogComponent, {
      width: '550px',
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
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
   * Invoked when user wants to copy the full URL of the endpoint.
   */
   copyPublicKey() {
    this.clipboard.copy(this.publicKeyFull.publicKey);
    this.feedbackService.showInfoShort('Public key was copied to your clipboard');
  }

  /*
   * Private helper methods.
   */

  /*
   * Retrieves the server's public key.
   */
  private getServerPublicKey() {
    this.cryptoService.serverPublicKey().subscribe({
      next: (key: any) => {
        if (key.result === 'FAILURE') {
          this.feedbackService.showInfo('No server key pair found, please create one');
          return;
        }
        this.publicKeyFull = <PublicKeyFull>key;
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }
}
