
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

/**
 * Modal dialog allowing you to create a new key/value pair.
 */
@Component({
  selector: 'app-create-key-value-dialog',
  templateUrl: './create-key-value-dialog.component.html',
  styleUrls: ['./create-key-value-dialog.component.scss']
})
export class CreateKeyValueDialogComponent {

  key: string;
  value: string;

  constructor(private dialogRef: MatDialogRef<CreateKeyValueDialogComponent>) {}

  onSubmit() {

    this.dialogRef.close({
      key: this.key,
      value: this.value,
    });
  }
}
