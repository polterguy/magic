
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { Router } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';

// Application specific imports.
import { Response } from 'src/app/models/response.model';
import { ConfigService } from '../../../../../services--/config.service';
import { MessageService } from 'src/app/services--/message.service';
import { BackendService } from 'src/app/services--/backend.service--';
import { FeedbackService } from 'src/app/services--/feedback.service';
import { BazarService } from 'src/app/components/management/services/bazar.service';
import { CryptoService } from 'src/app/components/management/crypto/services/crypto.service';
import { RecaptchaComponent } from 'ng-recaptcha';

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
   * to set the user's site_key for recaptcha
   */
   recaptchaKey: string = null;
   @ViewChild('captchaRef', {static: false}) captchaRef: RecaptchaComponent;

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
    private router: Router,
    private cryptoService: CryptoService,
    protected messageService: MessageService,
    private bazarService: BazarService) {
      this.recaptchaKey = this.backendService._bazaarCaptchaKey;
    }

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
   *
   * @param recaptcha_token received when reCaptcha component is executed,
   * recaptcha_token is optional, exists only if recaptcha key is available
   */
  next(recaptcha_token?: string) {
    const data: any = this.recaptchaKey !== null && this.recaptchaKey !== '' ? {
      email: this.email,
      name: this.subject,
      recaptcha_response: recaptcha_token,
    } : {
      email: this.email,
      name: this.subject
    };
    if (localStorage.getItem('subscribes-to-newsletter')) return this.generateKeypair();
    this.feedbackService.confirm(
      'Receive a promo code',
      'Do you want a promo code that gives you all Bazar items for free for a limited period? Join our mailing list and stay up-to-date for promotions! If you do, then make sure you verify your email address.',
      () => {
        this.bazarService.subscribeToNewsletter(data).subscribe({
            next: () => {
              localStorage.setItem('subscribes-to-newsletter', JSON.stringify({
                subscribing: true,
              }));
            },
            error: (error: any) => console.log(error)
          });
        this.generateKeypair();
      },
      (cancel) => {
        if (cancel === false) {
          this.generateKeypair();
        }
      });
  }

  /**
   * to make a click action on the invisible reCaptcha components and receive the token,
   * will be executed only if recaptcha key is available
   */
   executeRecaptcha(){
    this.captchaRef?.execute();
  }

  private generateKeypair() {
    this.cryptoService.generateKeyPair(
      +this.strength,
      this.seed,
      this.subject,
      this.email,
      this.domain).subscribe({
        next: () => {
          this.feedbackService.showInfo('Cryptography key pair successfully created');
          this.backendService.active.status.server_keypair = true;
          this.router.navigate(['/']);
        },
        error: (error: any) => this.feedbackService.showError(error)
      });
  }
}
