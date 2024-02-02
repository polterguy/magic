
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// Angular and system specific imports.
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Application specific imports.
import { GeneralService } from 'src/app/services/general.service';
import { CodemirrorActionsService } from 'src/app/services/codemirror-actions.service';
import { MachineLearningTrainingService } from 'src/app/services/machine-learning-training.service';

/**
 * Helper component to edit details of one single training item.
 */
@Component({
  selector: 'app-machine-learning-edit-training-snippet',
  templateUrl: './machine-learning-edit-training-snippet.component.html',
  styleUrls: ['./machine-learning-edit-training-snippet.component.scss']
})
export class MachineLearningEditTrainingSnippetComponent implements OnInit {

  types: string[] = [];
  type: string = null;
  prompt: string;
  uri: string;
  completion: string;
  pushed: boolean;
  cached: boolean;
  ready: boolean = false;
  model: HlModel;
  preview: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<MachineLearningEditTrainingSnippetComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generalService: GeneralService,
    private codemirrorActionsService: CodemirrorActionsService,
    private machineLearningTrainingService: MachineLearningTrainingService) { }

  ngOnInit() {

    // Checking if we're supposed to preview items or not.
    const prev = localStorage.getItem('preview-snippets');
    if (prev === 'true') {
      this.preview = true;
    }

    this.generalService.showLoading();

    this.machineLearningTrainingService.ml_types().subscribe({

      next: (result: any[]) => {

        this.generalService.hideLoading();
        this.types = result.map(x => x.type);
        this.initialize();
        this.typeChanged();
      },

      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error.error.message ?? error, 'errorMessage')
      }
    });
  }

  previewChanged() {

    // Storing value to localStorage
    localStorage.setItem('preview-snippets', this.preview ? 'true' : 'false');
  }

  typeChanged() {

    // Checking if we have a registered CodeMirror editor for type.
    const res = this.codemirrorActionsService.getActions(null, this.type);
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

  previous () {

    this.generalService.showLoading();
    this.machineLearningTrainingService.ml_training_snippets({
      limit: 1,
      order: 'ml_training_snippets.id',
      direction: 'desc',
      ['ml_training_snippets.id.lt']: this.data.id,
    }, false).subscribe({

      next: (result: any[]) => {

        this.generalService.hideLoading();
        if (result && result.length > 0) {
          this.data = result[0];
          this.initialize();
        } else {
          this.generalService.showFeedback('No more snippets', 'errorMessage');
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
    this.machineLearningTrainingService.ml_training_snippets({
      limit: 1,
      order: 'ml_training_snippets.id',
      direction: 'asc',
      ['ml_training_snippets.id.mt']: this.data.id,
    }, false).subscribe({

      next: (result: any[]) => {

        this.generalService.hideLoading();
        if (result && result.length > 0) {
          this.data = result[0];
          this.initialize();
        } else {
          this.generalService.showFeedback('No more snippets', 'errorMessage');
        }
      },

      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error.error.message ?? error, 'errorMessage');
      }
    });
  }

  save() {

    const data: any = {
      prompt: this.prompt,
      uri: this.uri,
      completion: this.ready ? this.model.hyperlambda : this.completion,
      type: this.type,
      pushed: this.pushed ? 1 : 0,
      cached: this.cached ? 1 : 0,
    };
    if (this.data) {
      data.id = this.data.id;
    }
    this.dialogRef.close(data);
  }

  /*
   * Private helper methods.
   */

  private initialize() {

    this.prompt = this.data?.prompt;
    this.uri = this.data?.uri;
    this.completion = this.data?.completion;
    this.type = this.data?.type;
    this.pushed = this.data?.pushed > 0 ? true : false;
    this.cached = this.data?.cached > 0 ? true : false;
  }
}

interface HlModel {
  hyperlambda: string,
  options: any
}
