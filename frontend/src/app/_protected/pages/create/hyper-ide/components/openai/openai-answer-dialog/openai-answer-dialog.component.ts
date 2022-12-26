
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { GeneralService } from 'src/app/_general/services/general.service';

/**
 * Model for displaying code result.
 */
export class CodeModel {
  code: string;
}

/**
 * Code dialog, showing user some code snippet.
 */
@Component({
  selector: 'app-openai-answer-dialog',
  templateUrl: './openai-answer-dialog.component.html',
  styleUrls: ['./openai-answer-dialog.component.scss']
})
export class OpenAIAnswerDialogComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CodeModel,
    private generalService: GeneralService,
    private clipBoard: Clipboard) { }

  copy() {
    this.clipBoard.copy(this.data.code);
    this.generalService.showFeedback('Content can be found on your clipboard');
  }
}
