
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, EventEmitter, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { GeneralService } from 'src/app/_general/services/general.service';
import { CodemirrorActionsService } from 'src/app/_protected/pages/create/hyper-ide/services/codemirror-actions.service';
import { DialogRef } from '@angular/cdk/dialog';

/**
 * Model for prompt result.
 */
export class PromptResult {

  /**
   * Result from OpenAI.
   */
  snippet: string;

  /**
   * Question that was asked.
   */
  prompt: string;

  /**
   * File type question was associated with, such as sql, hl or HTML.
   * 
   * Helps us create the correct CodeMirror editor type.
   */
  fileType: string;

  /**
   * Optional callback if exists will create a callback button allowing parent
   * component to use code snippet for 'whatever'.
   */
  callback?: EventEmitter<string>;

  /**
   * Optional callback text to display on callback button.
   */
  callbackText?: string;
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
    private dialog: DialogRef<OpenAIAnswerDialogComponent>,
    private codemirrorActionsService: CodemirrorActionsService,
    private clipBoard: Clipboard) { }

  ngOnInit() {

    this.options = this.codemirrorActionsService.getActions(null, this.data.fileType);
    setTimeout(() => {
      this.cmReady = true;
    }, 250);
  }

  callbackInvoked() {

    this.data.callback.emit(this.data.snippet);
    this.dialog.close();
  }

  copy() {

    this.clipBoard.copy(this.data.snippet);
    this.generalService.showFeedback('Content can be found on your clipboard');
  }
}
