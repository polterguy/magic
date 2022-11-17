
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component } from '@angular/core';
import { Validators, UntypedFormBuilder } from '@angular/forms';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { GeneralService } from 'src/app/_general/services/general.service';
import { AuthApiService } from '../services/auth-api.service';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { Router } from '@angular/router';

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

  constructor(
    private formBuilder: UntypedFormBuilder,
    private authApiService: AuthApiService,
    private generalService: GeneralService,
    private recaptchaV3Service: ReCaptchaV3Service,
    private router: Router) { }

  /**
   * forgot password form
   */
   forgotPass() {

     if (this.forgotPassForm.valid) {
       this.waiting = true;
       this.recaptchaV3Service.execute('forgotPassFormSubmission').subscribe({
         next: (token) => {
          const data: any = {
            username: this.forgotPassForm.value.username,
            frontendUrl: window.location.origin + '/authentication/reset-password',
            recaptcha_response: token,
          }

          // this.authApiService.forgotPass(data).subscribe((res: any) => {
          //   this.waiting = false;

          //   if (res && res?.Error) {

          //   } else {
          //     this.generalService.showFeedback('A reset password link is sent to your email', 'successMessage', 'Ok', 5000);
          //     this.router.navigateByUrl('/authentication/login')
          //   }
          // })
        },
        error: (e) => {
          this.waiting = false;
          this.generalService.showFeedback('Oops... please try again.');
        },
        complete: () => {}
      })

    } else {
      this.generalService.showFeedback('All fields are required', 'errorMessage', 'Ok');;
    }
  }
}
