
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

// Application specific imports.
import { GeneralService } from 'src/app/services/general.service';

/**
 * Modal dialog allowing you to create a new key/value pair.
 */
@Component({
  selector: 'app-create-key-value-dialog',
  templateUrl: './create-key-value-dialog.component.html',
  styleUrls: ['./create-key-value-dialog.component.scss']
})
export class CreateKeyValueDialogComponent implements OnInit {

  key: string;
  value: string;

  constructor(
    private generalService: GeneralService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<CreateKeyValueDialogComponent>) { }

  ngOnInit() {

    if (this.data) {
      this.key = this.data.key;
      this.value = this.data.value;
    }
  }

  onSubmit() {

    if (!this.key || !this.value || this.key === '' || this.value === '') {

      this.generalService.showFeedback('Please provide both key and value', 'errorMessage');
      return;
    }

    this.dialogRef.close({
      key: this.key,
      value: this.value,
      edit: !!this.data
    });
  }
}
