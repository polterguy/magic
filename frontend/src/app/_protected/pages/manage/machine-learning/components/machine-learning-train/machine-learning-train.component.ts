
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { MachineLearningTrainingService } from 'src/app/_general/services/machine-learning-training.service';
import { Count } from 'src/app/_protected/models/common/count.model';

/**
 * Helper component to start training of your Machine Learning model.
 */
@Component({
  selector: 'app-machine-learning-train',
  templateUrl: './machine-learning-train.component.html',
  styleUrls: ['./machine-learning-train.component.scss']
})
export class MachineLearningTrainComponent implements OnInit {

  count: number = 0;
  epochs: number = 4;
  batch_size: number = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generalService: GeneralService,
    private machineLearningTrainingService: MachineLearningTrainingService,
    private dialogRef: MatDialogRef<MachineLearningTrainComponent>,) { }

  ngOnInit() {

    this.generalService.showLoading();
    this.machineLearningTrainingService.ml_training_snippets_count({
      'ml_training_snippets.type.eq': this.data.type,
      'ml_training_snippets.pushed.eq': 0,
    }).subscribe({
      next: (result: Count) => {

        this.generalService.hideLoading();
        this.count = result.count;
        this.batch_size = Math.round(Math.min(Math.max(this.count / 500, 1), 256));
      },
      error: () => {

        this.generalService.hideLoading();
        this.generalService.showFeedback('Something went wrong as we tried to start training', 'errorMessage');
      }
    });
  }

  save() {

    const data: any = {
      type: this.data.type,
      epochs: this.epochs,
    };
    this.dialogRef.close(data);
  }
}
