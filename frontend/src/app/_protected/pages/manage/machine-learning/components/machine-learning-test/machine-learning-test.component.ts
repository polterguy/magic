
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Response } from 'src/app/models/response.model';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MachineLearningTrainingService } from 'src/app/_general/services/machine-learning-training.service';
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
  completion: string = '';
  isLoading: boolean = false;
  ready: boolean = false;
  model: HlModel;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generalService: GeneralService,
    private machineLearningTrainingService: MachineLearningTrainingService,
    private codemirrorActionsService: CodemirrorActionsService,
    private openAIService: OpenAIService,) { }

  ngOnInit() {

    // Checking if we have a registered CodeMirror editor for type.
    const res = this.codemirrorActionsService.getActions(null, this.data.type);
    if (res) {
      res.autofocus = false;
      this.model = {
        hyperlambda: this.data.completion,
        options: res,
      }
      setTimeout(() => {
        this.ready = true;
      }, 500);
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
        if (this.model) {
          this.model.hyperlambda = result.result;
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

  train() {

    this.generalService.showLoading();
    this.machineLearningTrainingService.ml_training_snippets_create({
      prompt: this.prompt,
      completion: this.model?.hyperlambda ?? this.completion,
      type: this.data.type,
    }).subscribe({
      next: () => {

        this.generalService.hideLoading();
        this.generalService.showFeedback('Training snippet successfully saved', 'successMessage');
        const el = <any>document.getElementsByName('prompt')[0];
        el.select();
        el.focus();
      },
      error: () => {

        this.generalService.hideLoading();
        this.generalService.showFeedback('Something went wrong as we tried to create your type', 'errorMessage');
      }
    });
  }
}

interface HlModel {
  hyperlambda: string,
  options: any
}
