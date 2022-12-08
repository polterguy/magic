
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';
import { GeneralService } from 'src/app/_general/services/general.service';
import { CryptoService } from '../../_services/crypto.service';
import { Response } from 'src/app/_protected/models/common/response.model';
import { ConfigService } from '../../../configuration/_services/config.service';

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
}

@Component({
  selector: 'app-new-server-key',
  templateUrl: './new-server-key.component.html'
})
export class NewServerKeyComponent implements OnInit {

  public newKey: NewKey = new NewKey;

  public strengthArray: number[] = [
    1024,
    2048,
    4096,
    8192
  ];

  public CommonRegEx = CommonRegEx;
  public CommonErrorMessages = CommonErrorMessages;

  public isWaiting: boolean = false;

  constructor(
    private configService: ConfigService,
    private cryptoService: CryptoService,
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<NewServerKeyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { type: string }) { }

  ngOnInit(): void {
    if (this.data.type === 'create') {
      this.getContent();
      this.newKey.strength = this.strengthArray[2];
    } else {
      this.newKey.type = 'RSA';
      this.newKey.enabled = false;
    }

  }

  private getContent() {
    this.configService.getGibberish(100, 200).subscribe({
      next: (result: Response) => {
        this.newKey.content = result.result;
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message??error, 'errorMessage')
    });
  }

  public save() {
    if (this.newKey.subject === '') {
      this.generalService.showFeedback('All fields are required.', 'errorMessage');
      return;
    }
    if (!this.validateEmail()) {
      this.generalService.showFeedback('Please provide a valid email address.', 'errorMessage');
      return;
    }
    if (!this.validateDomain()) {
      this.generalService.showFeedback('Please provide a valid domain.', 'errorMessage');
      return;
    }

    if (this.data.type === 'import') {
      if (this.newKey.fingerprint !== '') {
        this.import();
      } else {
        this.generalService.showFeedback('Public key is not valid.', 'errorMessage');
      }
    } else {
      if (this.newKey.content !== '') {
        this.create();
      } else {
        this.generalService.showFeedback('Seed is missing.', 'errorMessage');
      }
    }
  }

  private validateEmail() {
    return this.CommonRegEx.email.test(this.newKey.email);
  }

  public validateDomain() {
    return this.CommonRegEx.backend.test(this.newKey.domain.replace(/\/$/, ''));
  }

  /**
   * Invoked when user changes the value of the actual public key.
   */
  public publicKeyChanged() {
    if (this.data.type === 'create') {
      return;
    }

    this.cryptoService.getFingerprint(this.newKey.content).subscribe({
      next: (result: Response) => {
        this.newKey.fingerprint = result.result;
      },
      error: (error: any) => this.generalService.showFeedback(error?.error?.message??error, 'errorMessage')
    });
  }

  /**
   * Invoked when user clicks the import button to actually import the public key.
   */
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
    }
    this.cryptoService.createPublicKey(data).subscribe({
      next: (res: Response) => {
        this.generalService.showFeedback('Key successfully imported, please edit its vocabulary and enable it.', 'successMessage', 'Ok', 5000);
        this.isWaiting = false;
        this.dialogRef.close(true);
      },
      error: (error: any) => {
        this.isWaiting = false;
        this.generalService.showFeedback(error?.error?.message??error, 'errorMessage')
      }
    });
  }

  /**
   * Invoked when user wants to create the key pair, after having applied
   * strength and random gibberish.
   */
  private create() {
    this.isWaiting = true;
    this.cryptoService.generateKeyPair(
      this.newKey.strength,
      this.newKey.content,
      this.newKey.subject,
      this.newKey.email,
      this.newKey.domain.replace(/\/$/, '')).subscribe({
        next: () => {
          this.isWaiting = false;
          this.generalService.showFeedback('New key pair created successfully and the old key is backed up.', 'successMessage', 'Ok', 4000);
          this.dialogRef.close(true);
        },
        error: (error:any) => {
          this.isWaiting = false;
          this.generalService.showFeedback(error?.error?.message??error, 'errorMessage')
        }
      });
  }
}
