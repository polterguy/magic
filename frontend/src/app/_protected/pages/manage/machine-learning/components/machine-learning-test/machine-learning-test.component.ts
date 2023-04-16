
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MachineLearningTrainingService } from 'src/app/_general/services/machine-learning-training.service';
import { OpenAIService } from 'src/app/_general/services/openai.service';
import { CodemirrorActionsService } from 'src/app/_general/services/codemirror-actions.service';
import { MagicResponse } from 'src/app/_general/models/magic-response.model';
import { PromptResponse } from 'src/app/_general/models/prompt-response.model';
import { ConfigService } from 'src/app/_general/services/config.service';

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
  session: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generalService: GeneralService,
    private configService: ConfigService,
    private machineLearningTrainingService: MachineLearningTrainingService,
    private codemirrorActionsService: CodemirrorActionsService,
    private openAIService: OpenAIService,) { }

  ngOnInit() {

    this.generalService.showLoading();
    this.configService.getGibberish(20,30).subscribe({
      next: (result: MagicResponse) => {

        this.session = result.result;
        this.generalService.hideLoading();
      },
      error: () => {

        this.generalService.hideLoading();
        this.generalService.showFeedback('Something went wrong while trying to create a session identifier', 'errorMessage');
      }
    });

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

    this.openAIService.query(this.prompt, this.data.type, true, this.session,this.data.model).subscribe({
      next: (result: PromptResponse) => {

        this.generalService.hideLoading();
        if (this.model) {

          // Hyperlambda result.
          if (result.references?.length > 0) {
            result.result += '\r\n/*';
            for (var idx of result.references) {
              result.result += `\r\n * ${idx.uri} - ${idx.prompt}`;
            }
            result.result += '\r\n */\r\n';
          }
          this.model.hyperlambda = result.result;

        } else {

          // Anything BUT Hyperlambda result
          if (result.references?.length > 0) {
            result.result += '\r\n';
            for (var idx of result.references) {
              result.result += `\r\n* ${idx.uri} - ${idx.prompt}`;
            }
          }
          if (result.db_time) {
            result.result += '\r\n\r\n ==> ' + result.db_time + ' seconds fetching embeddings';
          }
          this.completion = result.result;
        }
        this.isLoading = false;
        setTimeout(() => {
          const el = <any>document.getElementsByName('prompt')[0];
          el.focus();
          el.select();
        }, 100);
      },
      error: () => {

        this.generalService.hideLoading();
        this.isLoading = false;
        this.generalService.showFeedback('Something went wrong as we tried to query OpenAI', 'errorMessage');
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
        this.generalService.showFeedback('Something went wrong as we tried to train on your snippet', 'errorMessage');
      }
    });
  }
}

interface HlModel {
  hyperlambda: string,
  options: any
}
