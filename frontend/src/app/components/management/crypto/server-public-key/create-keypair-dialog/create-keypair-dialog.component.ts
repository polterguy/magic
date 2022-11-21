
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

// Application specific imports.
import { Response } from 'src/app/models/response.model';
import { CryptoService } from '../../services/crypto.service';
import { ConfigService } from '../../../../../services--/config.service';
import { FeedbackService } from 'src/app/services--/feedback.service';

/**
 * Modal dialog used to create a new keypair for server.
 */
@Component({
  selector: 'app-create-keypair-dialog',
  templateUrl: './create-keypair-dialog.component.html'
})
export class CreateKeypairDialogComponent implements OnInit {

  /**
   * Identity for the key.
   */
  subject: string;

  /**
   * Email address you want to associate with your key.
   */
  email: string;

  /**
   * Base URL for your key.
   */
  domain = '';

  /**
   * Seed for CSRNG generator.
   */
  seed: string;

  /**
   * Key strength to use when generating key.
   */
  strength: number;

  /**
   * Options fo strength value when generating key.
   */
  strengthValues: number[] = [
    1024,
    2048,
    4096,
    8192,
  ]

  /**
   * Creates an instance of your component.
   *
   * @param configService Needed to retrieve random gibberish seeding the CSRNG as we create new key pair
   * @param cryptoService Needed to create private key pair
   * @param feedbackService Needed to provide feedback to user
   * @param dialogRef Needed to be able to close self when key has been created
   */
  constructor(
    private configService: ConfigService,
    private cryptoService: CryptoService,
    private feedbackService: FeedbackService,
    private dialogRef: MatDialogRef<CreateKeypairDialogComponent>) { }

  /**
   * Implementation of OnInit
   */
  ngOnInit() {
    this.configService.getGibberish(100, 200).subscribe({
      next: (result: Response) => {
        this.seed = result.result;
        this.strength = this.strengthValues[2];
      },
      error: (error: any) => this.feedbackService.showError(error)});
  }

  /**
   * Invoked when user wants to create the key pair, after having applied
   * strength and random gibberish.
   */
  create() {
    this.cryptoService.generateKeyPair(
      +this.strength,
      this.seed,
      this.subject,
      this.email,
      this.domain).subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (error:any) => this.feedbackService.showError(error)});
  }

  /**
   * Returns true if the form can be submitted.
   */
  public valid() {
    return this.seed && this.seed.length > 0 &&
      this.subject && this.subject.length > 0 &&
      this.email && this.email.length > 0 &&
      this.domain && this.domain.length > 0;
  }
}
