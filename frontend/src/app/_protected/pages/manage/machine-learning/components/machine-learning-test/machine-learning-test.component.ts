
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Response } from 'src/app/models/response.model';
import { GeneralService } from 'src/app/_general/services/general.service';
import { OpenAIService } from 'src/app/_general/services/openai.service';
import { CodemirrorActionsService } from 'src/app/_protected/pages/create/hyper-ide/services/codemirror-actions.service';

/**
 * Helper component to test model.
 */
@Component({
  selector: 'app-machine-learning-test',
  templateUrl: './machine-learning-test.component.html',
  styleUrls: ['./machine-learning-test.component.scss']
})
export class MachineLearningTestComponent implements OnInit {

  prompt: string = '';
  completion: string = 'Result ...';
  isLoading: boolean = false;
  hlReady: boolean = false;
  hlModel: HlModel;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generalService: GeneralService,
    private codemirrorActionsService: CodemirrorActionsService,
    private openAIService: OpenAIService,) { }

  ngOnInit() {

    // Checking if training snippet is Hyperlambda, at which point we display CodeMirror editor for content.
    if (this.data.type === 'hl') {
      const res = this.codemirrorActionsService.getActions(null, 'hl');
      res.autofocus = false;
      this.hlModel = {
        hyperlambda: this.data.completion,
        options: res,
      }
      setTimeout(() => {
        this.hlReady = true;
      }, 500);
    } else {
      this.hlReady = false;
    }
  }

  submit() {

    this.generalService.showLoading();
    this.isLoading = true;
    this.openAIService.query(this.prompt, this.data.type).subscribe({
      next: (result: Response) => {

        this.generalService.hideLoading();
        this.isLoading = false;
        this.completion = result.result;
        if (this.hlModel) {
          this.hlModel.hyperlambda = result.result;
        }
        setTimeout(() => {
          const el = <any>document.getElementsByName('prompt')[0];
          el.focus();
          el.select();
        }, 100);
      },
      error: () => {

        this.generalService.hideLoading();
        this.isLoading = false;
        this.generalService.showFeedback('Something went wrong as we tried to create your type', 'errorMessage');
      }
    });
  }
}

interface HlModel {
  hyperlambda: string,
  options: any
}
