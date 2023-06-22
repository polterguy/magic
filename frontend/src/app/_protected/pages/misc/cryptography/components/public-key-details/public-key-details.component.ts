
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { CryptoService } from '../../_services/crypto.service';
import { CodemirrorActionsService } from 'src/app/_general/services/codemirror-actions.service';
import { MagicResponse } from 'src/app/_general/models/magic-response.model';
import { PublicKey } from '../../_models/public-key.model';
import { Model } from 'src/app/codemirror/codemirror-hyperlambda/codemirror-hyperlambda.component';
import { ConfirmationDialogComponent } from 'src/app/_general/components/confirmation-dialog/confirmation-dialog.component';

/*
 * Helper class to encapsulate all public keys and their CodeMirror vocabulary options.
 */
class PublicKeyEx {

  /**
   * Helper field to combine subject and email into one field.
   */
  identity: string;

  /*
   * Public key as returned from server.
   */
  key: PublicKey;

  /*
   * Original key content. Stored in case user updates a key, such that we can log the old key's content.
   */
  original_content: string;

  /*
   * CodeMirror options for editing vocabulary.
   */
  options: Model;
}

/**
 * Helper component displaying details about the currently activated server key pair.
 */
@Component({
  selector: 'app-public-key-details',
  templateUrl: './public-key-details.component.html',
  styleUrls: ['./public-key-details.component.scss']
})
export class PublicKeyDetailsComponent implements OnInit {

  public username: string = '';

  public codemirrorReady: boolean = false;

  public waiting: boolean = false;

  constructor(
    private dialog: MatDialog,
    private clipboard: Clipboard,
    private cryptoService: CryptoService,
    private generalService: GeneralService,
    private codemirrorActionsService: CodemirrorActionsService,
    private dialogRef: MatDialogRef<PublicKeyDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { key: any, savePermission: boolean }) { }

  ngOnInit(): void {
    this.getUserAssociation();
    this.getCodeMirrorOptions();
  }

  private getUserAssociation() {
    if (!this.data.key.username) {
      this.cryptoService.getUserAssociation(this.data.key.id).subscribe({
        next: (result: any) => this.data.key.username = result.result,
        error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
      });
    }
  }

  public copyFingerprint(text: string) {
    this.clipboard.copy(text);
    this.generalService.showFeedback('Fingerprint can be found on your clipboard');
  }

  public copyContent(text: string) {
    this.clipboard.copy(text);
    this.generalService.showFeedback('Public key can be found on your clipboard');
  }

  private getCodeMirrorOptions() {
    const options = this.codemirrorActionsService.getActions(null, 'hl');
    const hlOptions: any = {
      hyperlambda: this.data.key.vocabulary,
      options: options
    }
    hlOptions.options.autofocus = false;
    this.data.key.options = hlOptions;

    setTimeout(() => {
      this.codemirrorReady = true;
    }, 300);
  }

  save() {
    this.waiting = true;
    const key: PublicKeyEx = {
      identity: '',
      original_content: this.data.key.original_content,
      key: {
        id: this.data.key.id,
        content: this.data.key.content,
        domain: this.data.key.domain,
        email: this.data.key.email,
        subject: this.data.key.subject,
        username: this.data.key.username,
        enabled: this.data.key.enabled,
        fingerprint: this.data.key.fingerprint,
        imported: this.data.key.imported,
        type: this.data.key.type,
        vocabulary: this.data.key.vocabulary,
      },
      options: this.data.key.options
    }

    key.key.vocabulary = key.options.hyperlambda;
    this.cryptoService.getFingerprint(key.key.content).subscribe({
      next: (response: MagicResponse) => {
        const fingerprintUpdated = key.key.fingerprint !== response.result;
        key.key.fingerprint = response.result;
        if (fingerprintUpdated) {
          this.dialog.open(ConfirmationDialogComponent, {
            width: '500px',
            data: {
              title: `Changing key for ${key.key.subject}`,
              description: 'Warning!',
              description_extra: 'Changing the actual key content will make it impossible to easily verify historic cryptographic invocations. <br/><br/>Are you sure you wish to proceed?',
              action_btn: 'Proceed',
              action_btn_color: 'warn',
              bold_description: true
            }
          }).afterClosed().subscribe((result: string) => {
            if (result === 'confirm') {
              let oldKey = '';
              for (var idx of key.original_content) {
                if (oldKey.length % 80 === 0 && oldKey.length !== 0) {
                  oldKey += '\r\n';
                }
                oldKey += idx;
              }

              this.saveKeyImplementation(key);
            }
          })
        } else {
          this.saveKeyImplementation(key);
        }
      },
      error: (error: any) => {
        this.waiting = false;
        this.generalService.showFeedback('Key content is not valid.', 'errorMessage')
      }
    });
  }

  private saveKeyImplementation(key: PublicKeyEx, extraInfo?: string) {
    this.cryptoService.updatePublicKey(key.key).subscribe({
      next: () => {
        let info = 'Key was successfully saved';
        if (extraInfo) {
          info += '. ' + extraInfo;
        }
        key.identity = key.key.subject + '  <' + key.key.email + '>';
        if (key.key.username && key.key.username !== '') {
          this.cryptoService.associateWithUser(key.key.id, key.key.username).subscribe({
            next: () => {
              if (extraInfo) {
                this.generalService.showFeedback(info, 'successMessage');
              } else {
                this.generalService.showFeedback(info, 'successMessage');
              }
              this.waiting = false;
              this.dialogRef.close(true);
            },
            error: (error: any) => {
              this.waiting = false;
              this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
            }
          });
        } else {
          this.cryptoService.deleteUserAssociation(key.key.id).subscribe({
            next: () => {
              if (extraInfo) {
                this.generalService.showFeedback(info, 'successMessage');
              } else {
                this.generalService.showFeedback(info, 'successMessage');
              }
              this.waiting = false;
              this.dialogRef.close(true);
            },
            error: (error: any) => {
              this.waiting = false;
              this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
            }
          });
        }
      },
      error: (error: any) => {
        this.waiting = false;
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
      }
    });
  }
}
