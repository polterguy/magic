
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

// Application specific imports.
import { Response } from 'src/app/models/response.model';
import { KeyPair } from 'src/app/components/management/crypto/models/key-pair.model';
import { CryptoService } from '../../services/crypto.service';
import { ConfigService } from 'src/app/services/config.service';

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
  public subject: string;

  /**
   * Email address you want to associate with your key.
   */
  public email: string;

  /**
   * Base URL for your key.
   */
  public domain = '';

  /**
   * Seed for CSRNG generator.
   */
  public seed: string;

  /**
   * Key strength to use when generating key.
   */
  public strength: number;

  /**
   * Options fo strength value when generating key.
   */
  public strengthValues: number[] = [
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
   * @param dialogRef Needed to be able to close self when key has been created
   */
  constructor(
    private configService: ConfigService,
    private cryptoService: CryptoService,
    private dialogRef: MatDialogRef<CreateKeypairDialogComponent>) { }

  /**
   * Implementation of OnInit
   */
  ngOnInit() {

    // Retrieving some default seed for key generating process.
    this.configService.getGibberish(100, 200).subscribe((result: Response) => {

      // Assigning model to result of backend invocation.
      this.seed = result.result;
      this.strength = this.strengthValues[2];
    });
  }

  /**
   * Invoked when user wants to create the key pair, after having applied
   * strength and random gibberish.
   */
  public create() {

    // Invoking backend to generate key pair.
    this.cryptoService.generateKeyPair(
      +this.strength,
      this.seed,
      this.subject,
      this.email,
      this.domain).subscribe((result: KeyPair) => {

      // Success, closing dialog.
      this.dialogRef.close(true);
    });
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
