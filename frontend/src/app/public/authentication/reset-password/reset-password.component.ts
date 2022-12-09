
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Input } from '@angular/core';
import { Validators, UntypedFormBuilder } from '@angular/forms';
import { PasswordsMatchingValidator } from 'src/app/_general/classes/passwords-matching-validator';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { GeneralService } from 'src/app/_general/services/general.service';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendService } from 'src/app/_protected/services/common/backend.service';

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
    passwordGroup: this.formBuilder.group({
      password: ['', [
        Validators.required
      ]],
      confirmPassword: ['', Validators.required]
    }, { validator: PasswordsMatchingValidator('password', 'confirmPassword') })
  });

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
    private activatedRouer: ActivatedRoute,
    private router: Router) {
    this.activatedRouer.queryParams.subscribe(params => {
      if (params) {
        if (params.token) {
          if (params.token.indexOf('.') > -1) {
            this.passwordToken = params.token;
          } else {
            this.router.navigateByUrl('/authentication')
          }
        }
      }
    });
  }

  /**
   * forgot password form
   */
  resetPass() {
    const data: any = {
      password: this.resetPassForm.value.passwordGroup.password
    }

    if (this.resetPassForm.valid) {
      this.waiting = true;
      this.backendService.changePassword(data).subscribe({
        next: (res: any) => {
          this.waiting = false;
          if (res && res?.Error) {

          } else {
            this.generalService.showFeedback('Password successfully changed', 'successMessage', 'Ok', 10000);
            this.router.navigateByUrl('/');
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
