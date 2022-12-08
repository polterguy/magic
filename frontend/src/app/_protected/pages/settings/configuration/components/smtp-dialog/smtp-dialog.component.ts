/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-smtp-dialog',
  templateUrl: './smtp-dialog.component.html'
})
export class SmtpDialogComponent implements OnInit {

  /**
   * Form builder
   */
  smtpForm = this.formBuilder.group({
    host: [''],
    port: [''],
    secure: [true],
    username: [''],
    password: [''],
    name: [''],
    address: ['']
  });

  constructor(
    private formBuilder: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<SmtpDialogComponent>) { }

  ngOnInit(): void {
    if (this.data) {
      this.setFormFields();
    }
  }

  /**
   * sets form fields
   */
  setFormFields() {
    this.smtpForm.setValue({
      host: this.data.host,
      port: this.data.port,
      secure: this.data.secure,
      username: this.data.username,
      password: this.data.password,
      name: this.data.from.name,
      address: this.data.from.address
    })
  }

  /**
   * Closes the dialog for the data to be saved in the parent component.
   */
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
