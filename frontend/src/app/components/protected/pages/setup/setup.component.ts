
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroupDirective, NgForm, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { CommonErrorMessages } from 'src/app/helpers/common-error-messages';
import { CommonRegEx } from 'src/app/helpers/common-regex';
import { GeneralService } from 'src/app/services/general.service';
import { ConfigService } from '../../../../services/config.service';
import { SetupModel } from '../../../../models/setup.model';

class MyErrorStateMatcher implements ErrorStateMatcher {

  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {

    const invalidCtrl = !!(control?.invalid && control?.parent?.dirty);
    const invalidParent = !!(control?.parent?.invalid && control?.parent?.dirty);
    return invalidCtrl || invalidParent;
  }
}

/**
 * Setup component allowing the user to configure the system initially.
 */
@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html'
})
export class SetupComponent implements OnInit {

  showPassword: boolean = false;
  waiting: boolean = false;
  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;
  matcher = new MyErrorStateMatcher();
  checkPasswords: ValidatorFn = (g: AbstractControl): ValidationErrors | null => {

    const pass = g.get('password')?.value;
    const confirmPass = g.get('passwordRepeat')?.value;
    return pass === confirmPass ? null : { notSame: true }
  }
  configForm = this.formBuilder.group({

    password: ['', [Validators.required, Validators.pattern('.{12,}')]],
    passwordRepeat: [''],
    name: ['', [Validators.required]],
    email: ['', [Validators.required]],
  });

  constructor(
    private formBuilder: FormBuilder,
    private configService: ConfigService,
    private generalService: GeneralService) {

    this.configForm.addValidators(this.checkPasswords);
  }

  ngOnInit() {

    this.configForm.controls.password.valueChanges.subscribe(() => {
      if (this.showPassword) {
        this.configForm.controls.passwordRepeat.setValue(this.configForm.controls.password.value);
      }
    });
  }

  toggleShowPassword() {

    this.showPassword = !this.showPassword;
    if (this.showPassword) {
      this.configForm.controls.passwordRepeat.setValue(this.configForm.controls.password.value);
      this.configForm.controls.passwordRepeat.disable();
    } else {
      this.configForm.controls.passwordRepeat.enable();
    }
  }

  submit() {

    if (this.configForm.invalid) {
      this.generalService.showFeedback('Please provide all fields', 'errorMessage');
      return;
    }

    this.generalService.showLoading();
    this.waiting = true;

    const payload: SetupModel = {
      password: this.configForm.controls.password.value,
      name: this.configForm.controls.name.value,
      email: this.configForm.controls.email.value,
    };

    this.configService.setup(payload).subscribe({

      next: () => {

        this.waiting = false;
        window.location.href = '/';
        this.generalService.hideLoading();
      },

      error: (error: any) => {

        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        this.generalService.hideLoading();
        this.waiting = false;
      }
    });
  }
}
