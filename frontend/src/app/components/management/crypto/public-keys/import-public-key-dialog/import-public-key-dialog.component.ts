
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

// Application specific imports.
import { Response } from 'src/app/models/response.model';
import { FeedbackService } from 'src/app/services--/feedback.service';
import { PublicKey } from 'src/app/components/management/crypto/models/public-key.model';
import { CryptoService } from 'src/app/components/management/crypto/services/crypto.service';

/**
 * Modal dialog component for importing a public key.
 */
@Component({
  selector: 'app-import-public-key-dialog',
  templateUrl: './import-public-key-dialog.component.html'
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
 * This declares which vocabulary cryptographically signed invocations
 * originating from the key is allowed to use when communicating with
 * your server. Please edit it as you see fit. This default value only
 * allows clients to query for which vocabulary to use, and nothing else
 * really.
 */
add
return
get-nodes
vocabulary
slots.vocabulary
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
  publicKeyChanged() {
    this.cryptoService.getFingerprint(this.key.content).subscribe((result: Response) => {
      this.key.fingerprint = result.result;
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user clicks the import button to actually import the public key.
   */
  import() {
    this.cryptoService.createPublicKey(this.key).subscribe((res: Response) => {
      this.dialogRef.close(this.key);
    }, (error: any) => this.feedbackService.showError(error));
  }
}
