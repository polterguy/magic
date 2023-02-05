
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MachineLearningTrainingService } from 'src/app/_general/services/machine-learning-training.service';
import { CodemirrorActionsService } from 'src/app/_general/services/codemirror-actions.service';

/**
 * Helper component to edit details of one single training item.
 */
@Component({
  selector: 'app-machine-learning-edit-training-snippet',
  templateUrl: './machine-learning-edit-training-snippet.component.html'
})
export class MachineLearningEditTrainingSnippetComponent implements OnInit {

  type: string = null;
  types: string[] = [];
  prompt: string;
  completion: string;
  pushed: boolean;
  ready: boolean = false;
  model: HlModel;

  constructor(
    private dialogRef: MatDialogRef<MachineLearningEditTrainingSnippetComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generalService: GeneralService,
    private codemirrorActionsService: CodemirrorActionsService,
    private machineLearningTrainingService: MachineLearningTrainingService) { }

  ngOnInit() {

    this.prompt = this.data?.prompt;
    this.completion = this.data?.completion;
    this.type = this.data?.type;
    this.pushed = this.data?.pushed > 0 ? true : false;

    this.generalService.showLoading();

    this.machineLearningTrainingService.ml_types().subscribe({
      next: (result: any[]) => {

        this.generalService.hideLoading();
        this.types = result.map(x => x.type);

        if (!this.data?.type) {

          // Defaulting to first type we can find.
          this.type = this.types.pop();
        }
        this.typeChanged();
      },
      error: () => {

        this.generalService.hideLoading();
        this.generalService.showFeedback('Something went wrong as we tried to delete your snippet', 'errorMessage');
      }
    });
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

  save() {

    const data: any = {
      prompt: this.prompt,
      completion: this.ready ? this.model.hyperlambda : this.completion,
      type: this.type,
      pushed: this.pushed ? 1 : 0,
    };
    if (this.data) {
      data.id = this.data.id;
    }
    this.dialogRef.close(data);
  }
}

interface HlModel {
  hyperlambda: string,
  options: any
}
