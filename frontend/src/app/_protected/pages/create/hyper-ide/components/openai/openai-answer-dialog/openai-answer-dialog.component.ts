
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { GeneralService } from 'src/app/_general/services/general.service';
import { CodemirrorActionsService } from '../../../services/codemirror-actions.service';

export class PromptResult {
  snippet: string;
  prompt: string;
  fileType: string;
}

/**
 * Code dialog, showing user some code snippet.
 */
@Component({
  selector: 'app-openai-answer-dialog',
  templateUrl: './openai-answer-dialog.component.html',
  styleUrls: ['./openai-answer-dialog.component.scss']
})
export class OpenAIAnswerDialogComponent implements OnInit {

  options: any;
  cmReady: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PromptResult,
    private generalService: GeneralService,
    private codemirrorActionsService: CodemirrorActionsService,
    private clipBoard: Clipboard) { }

  ngOnInit() {
    this.options = this.codemirrorActionsService.getActions(null, this.data.fileType);
    setTimeout(() => {
      this.cmReady = true;
    }, 250);
  }

  copy() {
    this.clipBoard.copy(this.data.snippet);
    this.generalService.showFeedback('Content can be found on your clipboard');
  }
}
