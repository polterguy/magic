
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system imports.
import { Component, Inject } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/services/general.service';

/**
 * Modal dialog allowing you to view the result of executing some piece of Hyperlambda.
 */
@Component({
  selector: 'app-execute-result-dialog',
  templateUrl: './execute-result-dialog.component.html',
  styleUrls: ['./execute-result-dialog.component.scss']
})
export class ExecuteResultDialog {

  /**
   * Creates an instance of your component.
   */
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: string,
    private clipBoard: Clipboard,
    private generalService: GeneralService) { }

  copy() {

    this.clipBoard.copy(this.data);
    this.generalService.showFeedback('You can find the content on your clipboard', 'successMessage');
  }
}
