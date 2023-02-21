
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Helper component to allow for configuring reCAPTCHA settings.
 */
@Component({
  selector: 'app-recaptcha-dialog',
  templateUrl: './recaptcha-dialog.component.html',
})
export class RecaptchaDialogComponent implements OnInit {

  captchaForm = this.formBuilder.group({
    key: [''],
    secret: [''],
  });

  constructor(
    private formBuilder: UntypedFormBuilder,
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

    const data = {
      key: this.captchaForm.value.key,
      secret: this.captchaForm.value.secret,
    }
    this.dialogRef.close(data);
  }
}
