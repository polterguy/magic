
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { GeneralService } from 'src/app/_general/services/general.service';

/**
 * Code dialog, showing user some code snippet.
 */
@Component({
  selector: 'app-openai-answer-dialog',
  templateUrl: './openai-answer-dialog.component.html',
  styleUrls: ['./openai-answer-dialog.component.scss']
})
export class OpenAIAnswerDialogComponent implements OnInit {

  text: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generalService: GeneralService,
    private clipBoard: Clipboard) { }

  ngOnInit() {
    console.log(this.data);
    this.data.sort((lhs: any, rhs: any) => {
      if (lhs.finish_reason === 'stop') {
        return -1;
      }
      if (rhs.finish_reason === 'stop') {
        return 1;
      }
      return 0;
    });
    this.text = this.data[0].text;
  }

  copy() {
    this.clipBoard.copy(this.data.code);
    this.generalService.showFeedback('Content can be found on your clipboard');
  }
}
