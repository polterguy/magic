
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';
import { GeneralService } from 'src/app/_general/services/general.service';

/**
 * Helper component used when saving SQL and Hyperlambda snippets, allowing
 * user to provide a name for snippet.
 */
@Component({
  selector: 'app-snippet-name-dialog',
  templateUrl: './snippet-name-dialog.component.html'
})
export class SnippetNameDialogComponent {

  CommonRegEx = CommonRegEx;
  CommonErrorMessages = CommonErrorMessages;

  constructor(
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<SnippetNameDialogComponent>,
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
