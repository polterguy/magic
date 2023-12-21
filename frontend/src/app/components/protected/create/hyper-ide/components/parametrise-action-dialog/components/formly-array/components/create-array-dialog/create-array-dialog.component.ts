
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

// Application specific imports.
import { GeneralService } from 'src/app/services/general.service';

/**
 * Modal dialog allowing you to create a new key/value pair.
 */
@Component({
  selector: 'app-create-array-dialog',
  templateUrl: './create-array-dialog.component.html',
  styleUrls: ['./create-array-dialog.component.scss']
})
export class CreateArrayDialogComponent {

  value: string;

  constructor(
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<CreateArrayDialogComponent>) {}

  onSubmit() {

    if (!this.value|| this.value === '') {

      this.generalService.showFeedback('Please provide a value', 'errorMessage');
      return;
    }

    this.dialogRef.close(this.value);
  }
}
