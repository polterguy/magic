
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Input } from '@angular/core';
import { Validators, UntypedFormBuilder } from '@angular/forms';
import { PasswordsMatchingValidator } from 'src/app/_general/classes/passwords-matching-validator';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { GeneralService } from 'src/app/_general/services/general.service';
import { BackendService } from 'src/app/_general/services/backend.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent {

  /**
   * to receive token from the parent component
   */
  @Input() passwordToken: string = '';

  /**
   * defining the forgot password form fields
   */
  resetPassForm = this.formBuilder.group({
    password: ['', [Validators.required]],
    confirmPassword: ['', Validators.required]
    }, { validator: PasswordsMatchingValidator('password', 'confirmPassword') });

  /**
   * handling errors
   */
  errors = CommonErrorMessages;

  /**
   * let user view the entered password
   */
  viewPassword: boolean = false;

  waiting: boolean = false;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private backendService: BackendService,
    private generalService: GeneralService,
    private router: Router) { }

  /**
   * forgot password form
   */
  resetPass() {

    if (this.resetPassForm.valid) {
      this.waiting = true;
      this.backendService.changePassword(this.resetPassForm.value.password).subscribe({
        next: (res: any) => {
          this.waiting = false;
          if (res.result === 'success') {
            this.generalService.showFeedback('Password successfully changed', 'successMessage', 'Ok', 10000);
            this.router.navigate(['/authentication/login']);
          }
        },
        error: (error: any) => {
          this.waiting = false;
          this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage')
        }
      });
    } else {
      this.generalService.showFeedback('All fields are required', 'errorMessage', 'Ok');;
    }
  }

}
