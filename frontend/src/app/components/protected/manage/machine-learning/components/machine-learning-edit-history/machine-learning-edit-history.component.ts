
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/services/general.service';
import { MachineLearningTrainingService } from 'src/app/services/machine-learning-training.service';
import { CodemirrorActionsService } from 'src/app/services/codemirror-actions.service';

/**
 * Helper component to edit details of one request.
 */
@Component({
  selector: 'app-machine-learning-edit-history',
  templateUrl: './machine-learning-edit-history.component.html',
  styleUrls: ['./machine-learning-edit-history.component.scss']
})
export class MachineLearningEditCacheComponent implements OnInit {

  train: boolean = false;
  cached: boolean = false;
  ready: boolean = false;
  model: HlModel;
  preview: boolean = false;

  constructor(
    private generalService: GeneralService,
    private machineLearningTrainingService: MachineLearningTrainingService,
    private dialogRef: MatDialogRef<MachineLearningEditCacheComponent>,
    private codemirrorActionsService: CodemirrorActionsService,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {

    // Checking if we're supposed to preview items or not.
    const prev = localStorage.getItem('preview-snippets');
    if (prev === 'true') {
      this.preview = true;
    }

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

  previous () {

    this.generalService.showLoading();
    this.machineLearningTrainingService.ml_requests({
      limit: 1,
      order: 'ml_requests.id',
      direction: 'desc',
      ['ml_requests.id.lt']: this.data.id,
    }).subscribe({

      next: (result: any[]) => {

        this.generalService.hideLoading();
        if (result && result.length > 0) {
          this.data = result[0];
        } else {
          this.generalService.showFeedback('No more items', 'errorMessage');
        }
      },

      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error.error.message ?? error, 'errorMessage');
      }
    });
  }

  next() {

    this.generalService.showLoading();
    this.machineLearningTrainingService.ml_requests({
      limit: 1,
      order: 'ml_requests.id',
      direction: 'asc',
      ['ml_requests.id.mt']: this.data.id,
    }).subscribe({

      next: (result: any[]) => {

        this.generalService.hideLoading();
        if (result && result.length > 0) {
          this.data = result[0];
        } else {
          this.generalService.showFeedback('No more items', 'errorMessage');
        }
      },

      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error.error.message ?? error, 'errorMessage');
      }
    });
  }

  getUrl(url: string) {

    return url?.replace('https://', '')?.replace('http://', '') ?? '';
  }

  save() {

    if (this.train) {

      // Creating training data before we save request.
      this.machineLearningTrainingService.ml_training_snippets_create({
        prompt: this.data.prompt,
        completion: this.ready ? this.model.hyperlambda : this.data.completion,
        type: this.data.type,
      }).subscribe({
        next: () => {

          this.saveImplementation();
        },
        error: () => {

          this.generalService.hideLoading();
          this.generalService.showFeedback('Something went wrong as we tried to create training data', 'errorMessage');
        }
      });

    } else {

      this.saveImplementation();
    }
  }

  /*
   * Private helper methods.
   */

  private saveImplementation() {

    this.dialogRef.close({
      id: this.data.id,
      prompt: this.data.prompt,
      completion: this.ready ? this.model.hyperlambda : this.data.completion,
      type: this.data.type,
      cached: this.data.cached,
    });
  }
}

interface HlModel {
  hyperlambda: string,
  options: any
}
