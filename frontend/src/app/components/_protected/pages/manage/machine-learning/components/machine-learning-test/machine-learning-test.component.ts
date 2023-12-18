
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/services/general.service';
import { MachineLearningTrainingService } from 'src/app/services/machine-learning-training.service';
import { OpenAIService } from 'src/app/services/openai.service';
import { CodemirrorActionsService } from 'src/app/services/codemirror-actions.service';
import { MagicResponse } from 'src/app/models/magic-response.model';
import { PromptResponse } from 'src/app/models/prompt-response.model';
import { ConfigService } from 'src/app/services/config.service';

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
  preview: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generalService: GeneralService,
    private configService: ConfigService,
    private machineLearningTrainingService: MachineLearningTrainingService,
    private codemirrorActionsService: CodemirrorActionsService,
    private openAIService: OpenAIService,) { }

  ngOnInit() {

    // Checking if we're supposed to preview items or not.
    const prev = localStorage.getItem('preview-snippets');
    if (prev === 'true') {
      this.preview = true;
    }

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

  previewChanged() {

    // Storing value to localStorage
    localStorage.setItem('preview-snippets', this.preview ? 'true' : 'false');
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
