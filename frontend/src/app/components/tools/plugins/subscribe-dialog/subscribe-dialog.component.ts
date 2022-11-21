
/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

// Angular and system imports.
import { MatDialogRef } from '@angular/material/dialog';
import { Component, OnInit, ViewChild } from '@angular/core';

// Application specific imports.
import { RecaptchaComponent } from 'ng-recaptcha';
import { Response } from 'src/app/models/response.model';
import { BazarService } from '../../../management/services/bazar.service';
import { BackendService } from 'src/app/services--/backend.service--';
import { ConfigService } from '../../../../services--/config.service';
import { FeedbackService } from 'src/app/services--/feedback.service';
import { NameEmailModel } from '../../../../models/name-email.model';

/**
 * Component allowing user to subscribe to Aista's newsletter.
 */
@Component({
  selector: 'app-subscribe-dialog',
  templateUrl: './subscribe-dialog.component.html'
})
export class SubscribeDialogComponent implements OnInit {

  /**
   * Name and email of user as published by backend.
   */
  model: NameEmailModel;

  /**
   * to set the user's site_key for recaptcha
   */
  public recaptchaKey: string = null;
  @ViewChild('captchaRef', { static: false }) captchaRef: RecaptchaComponent;

  /**
   * Creates an instance of your component.
   *
   * @param bazarService Needed to be able to subscribe user to our newsletter
   * @param configService Needed to retrieve user's name and email as specified during configuration
   * @param feedbackService Needed to display feedback to user
   * @param dialogRef Needed to be able to manually close dialog
   * @param backendService Needed to read the dynamic reCaptcha key associated with this account
   */
  constructor(
    private bazarService: BazarService,
    private configService: ConfigService,
    private feedbackService: FeedbackService,
    private dialogRef: MatDialogRef<SubscribeDialogComponent>,
    private backendService: BackendService) {
    this.recaptchaKey = this.backendService._bazaarCaptchaKey;
  }

  /**
   * Implementation of OnInit.
   */
  ngOnInit() {
    this.configService.rootUserEmailAddress().subscribe({
      next: (result: NameEmailModel) => {
        this.model = result;
        const data = localStorage.getItem('confirm-email-data');
        if (data && data !== '') {
          const dataObj = JSON.parse(data);
          this.model.email = dataObj.email;
          this.model.name = dataObj.name;
        }
      },
      error: (error: any) => { this.feedbackService.showError(error) }
    })
  }

  /**
   * Invoked when user clicks the OK button.
   * @param recaptcha_token received when reCaptcha component is executed,
   * recaptcha_token is optional, exists only if recaptcha key is available
   */
  ok(recaptcha_token?: string) {
    this.recaptchaKey !== null && this.recaptchaKey !== '' ? this.model['recaptcha_response'] = recaptcha_token : '';

    this.bazarService.subscribeToNewsletter(
      this.model).subscribe({
        next: (result: Response) => {
          if (result.result === 'success') {
            this.feedbackService.showInfo('Please confirm your email address by clicking the link in the email we sent you');
          } else if (result.result === 'no-change') {
            this.feedbackService.showInfo('We could not add you to our newsletter, did you already subscribe previously?');
          } else if (result.result === 'please-confirm') {
            this.feedbackService.showInfo('We have already sent a confirm email to you. Please check your inbox for an email from ServerGardens.Com');
          }

          localStorage.setItem('subscribes-to-newsletter', JSON.stringify({
            subscribing: true,
          }));
          this.dialogRef.close(this.model);
        },
        error: (error: any) => { this.feedbackService.showError(error) }
      })
  }

  /**
   * to make a click action on the invisible reCaptcha components and receive the token,
   * will be executed only if recaptcha key is available
   */
  executeRecaptcha() {
    this.captchaRef?.execute();
  }

  /**
   * Invoked when user clicks the Cancel button.
   */
  cancel() {
    this.dialogRef.close();
  }
}
