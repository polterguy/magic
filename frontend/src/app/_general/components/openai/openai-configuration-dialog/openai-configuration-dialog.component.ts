
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Response } from 'src/app/models/response.model';
import { GeneralService } from 'src/app/_general/services/general.service';
import { OpenAIModel, OpenAIService } from 'src/app/_general/services/openai.service';
import { OpenAITrainingDialogComponent } from '../openai-training-dialog/openai-training-dialog.component';

/**
 * OpenAI configuration modal dialog.
 */
@Component({
  selector: 'app-openai-configuration-dialog',
  templateUrl: './openai-configuration-dialog.component.html',
  styleUrls: ['./openai-configuration-dialog.component.scss']
})
export class OpenAIConfigurationDialogComponent implements OnInit {

  openApiKey: string = '';
  startTraining: boolean = true;
  models: OpenAIModel[] = [];
  selectedModel: OpenAIModel = null;
  max_tokens: number = 1000;
  temperature: number = 0.5;

  constructor(
    private dialogRef: MatDialogRef<OpenAIConfigurationDialogComponent>,
    private openAiService: OpenAIService,
    private dialog: MatDialog,
    private generalService: GeneralService) { }

  ngOnInit() {

    this.generalService.showLoading();

    this.openAiService.key().subscribe({
      next: (result: Response) => {

        this.openApiKey = result.result || '';

        if (result.result && result.result !== '') {
          this.startTraining = false;
        }

        this.openAiService.base_models().subscribe({
          next: (models: OpenAIModel[]) => {

            this.models = models;
            this.selectedModel = this.models[0];

            if (!this.openApiKey || this.openApiKey === '') {
              this.generalService.hideLoading();
              return;
            }

            this.openAiService.get_training_status().subscribe({
              next: (result: any[]) => {

                this.generalService.hideLoading();
                result = result || [];
                if (result.length > 0) {

                  // Filtering out such that only succeeded Hyperlambda models are shown to user.
                  const succeeded = result
                    .filter(x => x.fine_tuned_model?.includes('hyperlambda') && x.status === 'succeeded');

                  // Sorting such that most recent model comes first.
                  succeeded.sort((lhs, rhs) => {
                    if (lhs.created > rhs.created) {
                      return -1;
                    }
                    if (lhs.created < rhs.created) {
                      return 1;
                    }
                    return 0;
                  });

                  // Checking if there are models being trained.
                  if (result.filter(x => x.status === 'pending' || x.status === 'running').length > 0) {
                    this.generalService.showFeedback('You have models currently in training', 'successMessage');
                  }

                  if (succeeded.length > 0) {
                    this.models = succeeded
                      .map(x => {
                        return {
                          name: x.fine_tuned_model,
                          description: 'Fine tuned model',
                        }
                      })
                      .concat(this.models);

                    // Making sure we select the most recent model as our default.
                    this.selectedModel = this.models[0];
                  } else {
                    this.startTraining = true;
                  }
                } else {
                  this.startTraining = true;
                }
              },
              error: (error: any) => {
                this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
                this.generalService.hideLoading();
              }
            });
          },
          error: (error: any) => {
            this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
            this.generalService.hideLoading();
          }
        });
      },
      error: (error: any) => {
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  apiKeyChanged() {

    this.generalService.showLoading();

    this.openAiService.configure(
      this.openApiKey,
      this.selectedModel.name,
      this.max_tokens,
      this.temperature).subscribe({
      next: () => {

        this.generalService.showFeedback('Your OpenAI API key was saved to your configuration', 'successMessage');

        // To allow for configuration to kick in we need to sleep for 1 second
        setTimeout(() => {

          this.openAiService.get_training_status().subscribe({
            next: (result: any[]) => {

              this.generalService.hideLoading();
              result = result || [];
              if (result.length > 0) {
      
                // Verifying we've got trained models.
                result.sort((lhs, rhs) => {
                  if (lhs.created > rhs.created) {
                    return -1;
                  }
                  if (lhs.created < rhs.created) {
                    return 1;
                  }
                  return 0;
                });
      
                // Filtering in only models that succeeded their training.
                const succeeded = result.filter(x => x.status === 'succeeded');
                this.generalService.hideLoading();

                // Checking if there are models being trained.
                if (result.filter(x => x.status === 'running').length > 0) {
                  this.generalService.showFeedback('You have models currently in training');
                }
      
                if (succeeded.length > 0) {
                  this.startTraining = false;
                  this.models = succeeded
                    .map(x => {
                      return {
                        name: x.fine_tuned_model,
                        description: 'Fine tuned model',
                      }
                    })
                    .concat(this.models);
                  this.selectedModel = this.models[0];
                } else {
                  this.startTraining = true;
                }
              }
            },
            error: (error: any) => {
              this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
              this.generalService.hideLoading();
            }
          });
        }, 1000);
      },
      error: (error: any) => {
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  training_data() {
    const dialog = this.dialog.open(OpenAITrainingDialogComponent, {
      width: '80vw',
      maxWidth: '850px',
    });
    dialog.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.generalService.showFeedback('Notice, training your model might take several minutes, even hours');
      }
    });
}

  save() {

    this.generalService.showLoading();

    this.openAiService.configure(
      this.openApiKey,
      this.selectedModel.name,
      this.max_tokens,
      this.temperature).subscribe({
      next: () => {
        this.generalService.hideLoading();

        this.dialogRef.close({
          configured: true,
          start_training: this.startTraining,
        });

      },
      error: (error: any) => {
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  close() {
    this.dialogRef.close({
      configured: false,
      start_training: false,
    });
  }
}
