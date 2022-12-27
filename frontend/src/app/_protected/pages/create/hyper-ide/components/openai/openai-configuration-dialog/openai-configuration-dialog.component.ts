
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Response } from 'src/app/models/response.model';
import { GeneralService } from 'src/app/_general/services/general.service';
import { OpenAIService } from 'src/app/_general/services/openai.service';

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
  type: string = 'password';
  models: string[] = [];
  selectedModel: string = '';
  max_tokens: number = 100;
  temperature: number = 0;

  constructor(
    private dialogRef: MatDialogRef<OpenAIConfigurationDialogComponent>,
    private openAiService: OpenAIService,
    private generalService: GeneralService) { }

  ngOnInit() {
    this.generalService.showLoading();

    this.openAiService.key().subscribe({
      next: (result: Response) => {
        this.openApiKey = result.result || '';

        this.openAiService.base_models().subscribe({
          next: (models: string[]) => {
            this.models = models;
            this.selectedModel = this.models[0];

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

                  if (succeeded.length > 0) {
                    this.startTraining = false;
                    this.models = succeeded
                      .map(x => x.fine_tuned_model)
                      .concat(this.models);
                    this.selectedModel = this.models[0];
                  }
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

  save() {
    this.generalService.showLoading();
    this.openAiService.configure(this.openApiKey, this.selectedModel, this.max_tokens, this.temperature).subscribe({
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
