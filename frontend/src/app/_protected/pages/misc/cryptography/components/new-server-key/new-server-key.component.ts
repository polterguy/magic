
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';
import { GeneralService } from 'src/app/_general/services/general.service';
import { CryptoService } from '../../_services/crypto.service';
import { MagicResponse } from 'src/app/_general/models/magic-response.model';
import { ConfigService } from '../../../../../../_general/services/config.service';
import { BackendService } from 'src/app/_general/services/backend.service';

/**
 * Helper component allowing user to create new server key pair, and/or import public keys.
 */
@Component({
  selector: 'app-new-server-key',
  templateUrl: './new-server-key.component.html'
})
export class NewServerKeyComponent implements OnInit {

  newKey: NewKey = new NewKey;
  isWaiting: boolean = false;
  strengthArray: number[] = [
    1024,
    2048,
    4096,
    8192
  ];

  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;

  constructor(
    private configService: ConfigService,
    private cryptoService: CryptoService,
    private generalService: GeneralService,
    private backendService: BackendService,
    private dialogRef: MatDialogRef<NewServerKeyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { type: string }) { }

  ngOnInit() {

    if (this.data.type === 'create') {

      this.getContent();
      this.newKey.strength = this.strengthArray[2];

    } else {

      this.newKey.type = 'RSA';
      this.newKey.enabled = false;
    }
  }

  save() {

    if (this.newKey.subject === '') {

      this.generalService.showFeedback('All fields are required', 'errorMessage');
      return;
    }
    if (!this.validateEmail()) {

      this.generalService.showFeedback('Please provide a valid email address', 'errorMessage');
      return;
    }
    if (!this.validateDomain()) {

      this.generalService.showFeedback('Please provide a valid domain', 'errorMessage');
      return;
    }

    if (this.data.type === 'import') {

      if (this.newKey.fingerprint === '') {

        this.generalService.showFeedback('Public key is not valid', 'errorMessage');
        return;
      }
      this.import();

    } else {

      if (this.newKey.content === '') {

        this.generalService.showFeedback('Seed is missing', 'errorMessage');
        return;
      }
      this.create();
    }
  }

  validateDomain() {

    return this.CommonRegEx.backend.test(this.newKey.domain.replace(/\/$/, ''));
  }

  publicKeyChanged() {

    if (this.data.type === 'create') {
      return;
    }

    this.cryptoService.getFingerprint(this.newKey.content).subscribe({
      next: (result: MagicResponse) => {

        this.newKey.fingerprint = result.result;
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  /*
   * Private helper methods.
   */

  private validateEmail() {

    return this.CommonRegEx.email.test(this.newKey.email);
  }

  private getContent() {

    this.configService.getGibberish(100, 200).subscribe({
      next: (result: MagicResponse) => {

        this.newKey.content = result.result;
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
    });
  }

  private import() {

    this.isWaiting = true;
    const data: NewKey = {
      subject: this.newKey.subject,
      email: this.newKey.email,
      domain: this.newKey.domain.replace(/\/$/, ''),
      content: this.newKey.content,
      enabled: this.newKey.enabled,
      fingerprint: this.newKey.fingerprint,
      type: this.newKey.type,
      vocabulary: this.newKey.vocabulary,
    };
    this.cryptoService.createPublicKey(data).subscribe({
      next: () => {

        this.generalService.showFeedback('Key successfully imported, please edit its vocabulary and enable it.', 'successMessage', 'Ok', 5000);
        this.isWaiting = false;
        this.dialogRef.close(true);
      },
      error: (error: any) => {

        this.isWaiting = false;
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
      }
    });
  }

  private create() {

    this.isWaiting = true;
    this.cryptoService.generateKeyPair(
      this.newKey.strength,
      this.newKey.content,
      this.newKey.subject,
      this.newKey.email,
      this.newKey.domain.replace(/\/$/, ''),
      this.backendService.active.username).subscribe({
        next: () => {

          this.isWaiting = false;
          this.generalService.showFeedback('New key pair created successfully and the old key is backed up.', 'successMessage', 'Ok', 4000);
          this.dialogRef.close(true);
        },
        error: (error: any) => {

          this.isWaiting = false;
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
        }
      });
  }
}

class NewKey {
  subject: string = '';
  email: string = '';
  domain: string = '';
  content: string = '';
  strength?: number;
  fingerprint: string;
  enabled: boolean;
  type: string;
  vocabulary: string = `/*
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
    `;
};
