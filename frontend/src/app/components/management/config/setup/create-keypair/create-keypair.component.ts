
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Component, OnInit } from '@angular/core';

// Application specific imports.
import { Messages } from 'src/app/models/messages.model';
import { Response } from 'src/app/models/response.model';
import { MessageService } from 'src/app/services/message.service';
import { BackendService } from 'src/app/services/backend.service';
import { FeedbackService } from 'src/app/services/feedback.service';
import { ConfigService } from 'src/app/services/management/config.service';
import { CryptoService } from 'src/app/components/management/crypto/services/crypto.service';
import { BazarService } from 'src/app/services/management/bazar.service';

/**
 * Component allowing user to setup a cryptography key pair.
 */
@Component({
  selector: 'app-create-keypair',
  templateUrl: './create-keypair.component.html'
})
export class CreateKeypairComponent implements OnInit {

  public doSubscribe: boolean = true;

  /**
   * Identity for the key.
   */
  public subject = '';

  /**
   * Email address you want to associate with your key.
   */
  public email = '';

  /**
   * Base URL for your key.
   */
  public domain = '';

  /**
   * Strength of key pair to generate.
   */
  public strength = '4096';

  /**
   * CSRNG seed used when generating cryptography key.
   */
  public seed = '';

  /**
   * Creates an instance of your component.
   * 
   * @param backendService Needed to retrieve the root URL for the current backend
   * @param feedbackService Needed to provide feedback to user
   * @param configService Configuration service used to generate server key pair
   * @param cryptoService Needed to generate key pair
   * @param messageService Message service used to publish messages to other components.
   */
  public constructor(
    private backendService: BackendService,
    private feedbackService: FeedbackService,
    private configService: ConfigService,
    private cryptoService: CryptoService,
    protected messageService: MessageService,
    private bazarService: BazarService) {
  }

  /**
   * OnInit implementation.
   */
  public ngOnInit() {

    // Defaulting URL parts to current backend's URL.
    this.domain = this.backendService.active.url;

    // Getting some initial random gibberish to use as seed when generating key pair.
    this.configService.getGibberish(200, 300).subscribe((res: Response) => {

      // Applying seed.
      this.seed = res.result;

    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user clicks the next button.
   */
  public next() {

    // Invoking backend to generate a key pair.
    this.cryptoService.generateKeyPair(
      +this.strength,
      this.seed,
      this.subject,
      this.email,
      this.domain).subscribe(() => {

      // Success, giving feedback to user.
      this.feedbackService.showInfo('Cryptography key pair successfully created');

      // Publishing message informing other components that setup state was changed.
      this.messageService.sendMessage({
        name: Messages.SETUP_STATE_CHANGED,
        content: 'crypto'
      });
      this.doSubscribe === true ? this.subscribeToNewsletter() : '';
    }, (error: any) => this.feedbackService.showError(error));
  }

  public subscribeToNewsletter(){
    // Invoking Bazar service to subscribe to our newsletter.
    this.bazarService.subscribeToNewsletter(
      this.subject,
      this.email).subscribe((result: Response) => {

        // Storing the fact that user has subscribed to newsletter in local storage.
        localStorage.setItem('subscribes-to-newsletter', JSON.stringify({
          subscribing: true,
        }));

      }, (error: any) => console.log('err'));
  }
}
