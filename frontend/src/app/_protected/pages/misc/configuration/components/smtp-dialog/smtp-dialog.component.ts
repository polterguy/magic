
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 and Thomas Hansen, 2023 - For questions contact team@ainiro.io.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';

/**
 * Helper modal dialog to allow user to configure his SMTP server settings.
 */
@Component({
  selector: 'app-smtp-dialog',
  templateUrl: './smtp-dialog.component.html'
})
export class SmtpDialogComponent implements OnInit {

  smtpForm = this.formBuilder.group({
    host: [''],
    port: [''],
    secure: [true],
    username: [''],
    password: [''],
    name: [''],
    address: ['']
  });

  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;

  constructor(
    private formBuilder: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<SmtpDialogComponent>) { }

  ngOnInit() {

    if (this.data) {
      this.smtpForm.setValue({
        host: this.data.host,
        port: this.data.port,
        secure: this.data.secure,
        username: this.data.username,
        password: this.data.password,
        name: this.data.from.name,
        address: this.data.from.address
      });
    }
  }

  submit() {

    const data = {
      host: this.smtpForm.value.host,
      port: this.smtpForm.value.port,
      secure: this.smtpForm.value.secure,
      username: this.smtpForm.value.username,
      password: this.smtpForm.value.password,
      from: {
        name: this.smtpForm.value.name,
        address: this.smtpForm.value.address
      }
    }
    this.dialogRef.close(data);
  }
}
