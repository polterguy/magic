
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonErrorMessages } from 'src/app/helpers/common-error-messages';
import { CommonRegEx } from 'src/app/helpers/common-regex';
import { GeneralService } from 'src/app/services/general.service';

/**
 * Helper component used when saving SQL and Hyperlambda snippets, allowing
 * user to provide a name for snippet.
 */
@Component({
  selector: 'app-save-snippet-dialog',
  templateUrl: './save-snippet-dialog.component.html'
})
export class SaveSnippetDialogComponent {

  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;

  constructor(
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<SaveSnippetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string) { }

  save() {

    if (!this.validateName() || this.data === '') {
      this.generalService.showFeedback('Invalid input.', 'errorMessage');
      return;
    }
    this.dialogRef.close(this.data);
  }

  /*
   * Private helper methods.
   */

  private validateName() {

    return this.CommonRegEx.appNames.test(this.data);
  }
}
