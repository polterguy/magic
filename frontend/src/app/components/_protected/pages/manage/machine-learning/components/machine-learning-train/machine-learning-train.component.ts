
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralService } from 'src/app/services/general.service';
import { MachineLearningTrainingService } from 'src/app/services/machine-learning-training.service';
import { OpenAIModel, OpenAIService } from 'src/app/services/openai.service';
import { Count } from 'src/app/models/count.model';

/**
 * Helper component to start training of your Machine Learning model.
 */
@Component({
  selector: 'app-machine-learning-train',
  templateUrl: './machine-learning-train.component.html'
})
export class MachineLearningTrainComponent implements OnInit {

  count: number = 0;
  epochs: number = null;
  batch_size: number = null;
  learning_rate_multiplier: number = null;
  prompt_loss_weight: number = null;
  model: OpenAIModel = null;
  models: OpenAIModel[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private generalService: GeneralService,
    private openAIService: OpenAIService,
    private machineLearningTrainingService: MachineLearningTrainingService,
    private dialogRef: MatDialogRef<MachineLearningTrainComponent>,) { }

  ngOnInit() {

    this.generalService.showLoading();
    this.machineLearningTrainingService.ml_training_snippets_count({
      'ml_training_snippets.type.eq': this.data.type,
      'ml_training_snippets.pushed.eq': 0,
    }).subscribe({
      next: (result: Count) => {

        this.count = result.count;

        if (this.count === 0) {
          this.generalService.hideLoading();
          return;
        }

        this.openAIService.models().subscribe({
          next: (models: OpenAIModel[]) => {

            // Making sure we filter away any models that cannot be fine tuned.
            const tunedModels = [
              'ada',
              'babbage',
              'curie',
              'davinci'
            ];
            this.models = models
              .filter(x => (x.owned_by !== 'system' && !x.owned_by.startsWith('openai') ) || tunedModels.includes(x.id));
            if (this.data?.model) {
              this.model = this.models.filter(x => x.id === this.data.model).pop();
            } else {
              this.model = this.models.filter(x => x.id === 'curie')[0];
            }
            this.generalService.hideLoading();
          },
          error: () => {
    
            this.generalService.showFeedback('Something went wrong as we tried to retrieve models', 'errorMessage');
            this.generalService.hideLoading();
          }
        });
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
      model: this.model.id,
      epochs: this.epochs,
      batch_size: this.batch_size,
      learning_rate_multiplier: this.learning_rate_multiplier,
      prompt_loss_weight: this.prompt_loss_weight,
    };
    this.dialogRef.close(data);
  }
}
