
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { GeneralService } from 'src/app/_general/services/general.service';
import { CodemirrorActionsService } from '../../../services/codemirror-actions.service';


/**
 * Code dialog, showing user some code snippet.
 */
@Component({
  selector: 'app-openai-answer-dialog',
  templateUrl: './openai-answer-dialog.component.html',
  styleUrls: ['./openai-answer-dialog.component.scss']
})
export class OpenAIAnswerDialogComponent implements OnInit {

  hlModel: HlModel;
  hlReady: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generalService: GeneralService,
    private codemirrorActionsService: CodemirrorActionsService,
    private clipBoard: Clipboard) { }

  ngOnInit() {
    this.data.snippets.sort((lhs: any, rhs: any) => {
      if (lhs.finish_reason === 'stop') {
        return -1;
      }
      if (rhs.finish_reason === 'stop') {
        return 1;
      }
      return 0;
    });
    this.codemirrorActionsService.getActions(null, 'hl').then((res: any) => {
      res.autofocus = false;
      this.hlModel = {
        hyperlambda: this.data.snippets[0].text,
        options: res,
      }
      setTimeout(() => {
        this.hlReady = true;
      }, 250);
    });
  }

  copy() {
    this.clipBoard.copy(this.hlModel.hyperlambda);
    this.generalService.showFeedback('Content can be found on your clipboard');
  }
}

interface HlModel {
  hyperlambda: string,
  options: any
}
