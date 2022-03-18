
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
import { BazarService } from 'src/app/services/management/bazar.service';
import { ConfigService } from 'src/app/services/management/config.service';
import { CryptoService } from 'src/app/components/management/crypto/services/crypto.service';

/**
 * Component allowing user to create a cryptography key pair.
 */
@Component({
  selector: 'app-create-keypair',
  templateUrl: './create-keypair.component.html'
})
export class CreateKeypairComponent implements OnInit {

  /**
   * If true user wants to subscribe to newsletter.
   */
  doSubscribe: boolean = true;

  /**
   * Identity for the key.
   */
  subject = '';

  /**
   * Email address you want to associate with your key.
   */
  email = '';

  /**
   * Base URL for your key.
   */
  domain = '';

  /**
   * Strength of key pair to generate.
   */
  strength = '4096';

  /**
   * CSRNG seed used when generating cryptography key.
   */
  seed = '';

  /**
   * Creates an instance of your component.
   * 
   * @param backendService Needed to retrieve the root URL for the current backend
   * @param feedbackService Needed to provide feedback to user
   * @param configService Configuration service used to generate server key pair
   * @param cryptoService Needed to generate key pair
   * @param messageService Message service used to publish messages to other components.
   * @param bazarService Needed to be able to subscribe user to newsletter
   */
  constructor(
    private backendService: BackendService,
    private feedbackService: FeedbackService,
    private configService: ConfigService,
    private cryptoService: CryptoService,
    protected messageService: MessageService,
    private bazarService: BazarService) { }

  /**
   * OnInit implementation.
   */
  ngOnInit() {
    this.domain = this.backendService.active.url;
    this.configService.getGibberish(200, 300).subscribe((res: Response) => {
      this.seed = res.result;
    }, (error: any) => this.feedbackService.showError(error));
  }

  /**
   * Invoked when user clicks the next button.
   */
  next() {
    this.cryptoService.generateKeyPair(
      +this.strength,
      this.seed,
      this.subject,
      this.email,
      this.domain).subscribe(() => {
      this.feedbackService.showInfo('Cryptography key pair successfully created');
      this.messageService.sendMessage({
        name: Messages.SETUP_STATE_CHANGED,
        content: 'crypto'
      });
      this.doSubscribe === true ? this.subscribeToNewsletter() : '';
    }, (error: any) => this.feedbackService.showError(error));
  }

  subscribeToNewsletter(){
    this.bazarService.subscribeToNewsletter(
      this.subject,
      this.email).subscribe((result: Response) => {
        localStorage.setItem('subscribes-to-newsletter', JSON.stringify({
          subscribing: true,
        }));
      }, (error: any) => console.log('err'));
  }
}
