
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MachineLearningTrainingService } from 'src/app/_general/services/machine-learning-training.service';
import { CodemirrorActionsService } from 'src/app/_protected/pages/create/hyper-ide/services/codemirror-actions.service';

/**
 * Helper component to edit details of one request.
 */
@Component({
  selector: 'app-machine-learning-edit-request',
  templateUrl: './machine-learning-edit-request.component.html',
  styleUrls: ['./machine-learning-edit-request.component.scss']
})
export class MachineLearningEditRequestComponent implements OnInit {

  train: boolean = false;
  ready: boolean = false;
  model: HlModel;

  constructor(
    private generalService: GeneralService,
    private machineLearningTrainingService: MachineLearningTrainingService,
    private dialogRef: MatDialogRef<MachineLearningEditRequestComponent>,
    private codemirrorActionsService: CodemirrorActionsService,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

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
    });
  }
}

interface HlModel {
  hyperlambda: string,
  options: any
}
