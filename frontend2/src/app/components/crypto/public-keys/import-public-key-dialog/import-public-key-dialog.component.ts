
/*
 * Copyright(c) Thomas Hansen thomas@servergardens.com, all right reserved
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Response } from 'src/app/models/response.model';
import { PublicKey } from 'src/app/models/public-key.model';
import { CryptoService } from 'src/app/services/crypto.service';

// Application specific imports.
import { FeedbackService } from 'src/app/services/feedback.service';

/**
 * Modal dialog component for importing a public key.
 */
@Component({
  selector: 'app-import-public-key-dialog',
  templateUrl: './import-public-key-dialog.component.html',
  styleUrls: ['./import-public-key-dialog.component.scss']
})
export class ImportPublicKeyDialogComponent {

  /**
   * Default initial values for key user wants to import.
   */
  public key: PublicKey = {
    type: 'RSA',
    subject: '',
    email: '',
    domain: '',
    fingerprint: '',
    content: '',
    enabled: false,
    vocabulary: `/*
 * In order for clients to intelligently communicate with your
 * server, at the very least you should whitelist [vocabulary]
 * and [slots.vocabulary] - Since this allows clients to query your
 * server for what slots they're allowed to invoke.
 */
vocabulary
slots.vocabulary
log.info
add
get-nodes
return
`,
  };

  /**
   * Creates an instance of your component.
   * 
   * @param dialogRef Needed to be able to close dialog
   * @param cryptoService Needed to be able to retrieve fingerprint for key as user changes key content
   * @param feedbackService Needed to be able to display information to user
   */
  constructor(
    private dialogRef: MatDialogRef<ImportPublicKeyDialogComponent>,
    private cryptoService: CryptoService,
    private feedbackService: FeedbackService) { }

  /**
   * Invoked when user changes the value of the actual public key.
   */
  public publicKeyChanged() {

    // Retrieving fingerprint for key.
    this.cryptoService.getFingerprint(this.key.content).subscribe((result: Response) => {
      this.key.fingerprint = result.result;
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user clicks the import button to actually import the public key.
   */
  public import() {

    // Importing key.
    this.cryptoService.importPublicKey(this.key).subscribe((res: Response) => {
      console.log(res);
      this.dialogRef.close(this.key);
    }, (error: any) => this.feedbackService.showError(error));
  }
}
