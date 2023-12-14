
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, ViewChild } from '@angular/core';
import { Validators, UntypedFormBuilder } from '@angular/forms';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { GeneralService } from 'src/app/_general/services/general.service';
import { RecaptchaComponent } from 'ng-recaptcha';
import { Router } from '@angular/router';
import { BackendService } from 'src/app/_general/services/backend.service';

/**
 * Helper component to allow user to have a reset password email sent to him on his configured email address.
 */
@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {

  /**
   * defining the forgot password form fields
   */
  forgotPassForm = this.formBuilder.group({
    username: ['', [Validators.required]]
  });

  /**
   * handling errors
   */
  errors = CommonErrorMessages;

  /**
   * let user view the entered password
   */
  viewPassword: boolean = false;

  /**
   * remeber me checkbox value
   */
  rememberPassword: boolean = false;

  waiting: boolean = false;

  /**
   * to set the user's site_key for recaptcha
   */
  recaptchaKey: string = null;
  @ViewChild('captchaRef', { static: false }) captchaRef: RecaptchaComponent;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private generalService: GeneralService,
    private backendService: BackendService,
    private router: Router) {
    this.backendService._activeCaptchaValue.subscribe((key: string) => {
      this.recaptchaKey = key;
    })
  }

  /**
   * Invoked when user requests a reset password link to be generated
   * and sent to him on email.
   *
   * Notice, assumes username is a valid email address.
   * @param recaptcha_token received when reCaptcha component is executed,
   * recaptcha_token is optional, exists only if recaptcha key is available
   */
  forgotPass(recaptcha_token?: string) {

    if (this.forgotPassForm.valid) {
      this.waiting = true;
      const data: any = this.recaptchaKey !== null && this.recaptchaKey !== '' ? {
        username: this.forgotPassForm.value.username,
        frontendUrl: window.location.origin + '/authentication/reset-password',
        recaptcha_response: recaptcha_token,
      } : {
        username: this.forgotPassForm.value.username,
        frontendUrl: window.location.origin + '/authentication/reset-password',
      };

      this.backendService.resetPassword(data).subscribe({
        next: (res: any) => {
          this.waiting = false;

          if (res && res?.Error) {

          } else {
            this.generalService.showFeedback('A reset password link is sent to your email', 'successMessage', 'Ok', 5000);
            this.router.navigateByUrl('/authentication/login')
          }
        },
        error: (error: any) => this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
      });
    } else {
      this.generalService.showFeedback('All fields are required', 'errorMessage', 'Ok');;
    }
  }

  /**
   * to make a click action on the invisible reCaptcha components and receive the token,
   * will be executed only if recaptcha key is available
   */
  executeRecaptcha() {

    this.captchaRef?.execute();
  }
}
