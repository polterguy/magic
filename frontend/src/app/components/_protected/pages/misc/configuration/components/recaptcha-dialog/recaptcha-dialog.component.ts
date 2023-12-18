
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { GeneralService } from 'src/app/services/general.service';

/**
 * Helper component to allow for configuring reCAPTCHA settings.
 */
@Component({
  selector: 'app-recaptcha-dialog',
  templateUrl: './recaptcha-dialog.component.html',
  styleUrls: ['./recaptcha-dialog.component.scss']
})
export class RecaptchaDialogComponent implements OnInit {

  captchaForm = this.formBuilder.group({
    key: [''],
    secret: [''],
  });

  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<RecaptchaDialogComponent>) { }

  ngOnInit() {

    if (this.data) {
      this.captchaForm.setValue({
        key: this.data.key,
        secret: this.data.secret,
      });
    }
  }

  submit() {

    if (!this.CommonRegEx.recaptcha.test(this.captchaForm.value.key) ||
      !this.CommonRegEx.recaptcha.test(this.captchaForm.value.secret)) {

        this.generalService.showFeedback('Not valid values for reCAPTCHA', 'errorMessage');
        return;
    }

    const data = {
      key: this.captchaForm.value.key,
      secret: this.captchaForm.value.secret,
    }
    this.dialogRef.close(data);
  }
}
