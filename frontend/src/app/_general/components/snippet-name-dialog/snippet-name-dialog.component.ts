
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonErrorMessages } from 'src/app/_general/classes/common-error-messages';
import { CommonRegEx } from 'src/app/_general/classes/common-regex';
import { GeneralService } from 'src/app/_general/services/general.service';

@Component({
  selector: 'app-snippet-name-dialog',
  templateUrl: './snippet-name-dialog.component.html'
})
export class SnippetNameDialogComponent {

  public CommonRegEx = CommonRegEx;
  public CommonErrorMessages = CommonErrorMessages;

  constructor(
    private generalService: GeneralService,
    private dialogRef: MatDialogRef<SnippetNameDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string) { }

  public save() {
    if (!this.validateName() || this.data === '') {
      this.generalService.showFeedback('Invalid input.', 'errorMessage');
      return;
    }

    this.dialogRef.close(this.data);
  }

  private validateName() {
    return this.CommonRegEx.appNames.test(this.data);
  }
}
