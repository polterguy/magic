
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { OpenAIService } from 'src/app/_general/services/openai.service';

/**
 * OpenAI training dialog component showing user all snippets used for training Hyperlambda model.
 */
@Component({
  selector: 'app-openai-training-dialog',
  templateUrl: './openai-training-dialog.component.html',
  styleUrls: ['./openai-training-dialog.component.scss']
})
export class OpenAITrainingDialogComponent implements OnInit {

  dataSource: any[] = [];

  constructor(
    private dialogRef: MatDialogRef<OpenAITrainingDialogComponent>,
    private generalService: GeneralService,
    private openAiService: OpenAIService) { }

  ngOnInit() {

    this.generalService.showLoading();

    this.openAiService.get_training_data().subscribe({
      next: (result: any[]) => {

        this.generalService.hideLoading();
        const unfoldedResult: any[] = [];
        for (const idx of result) {
          const prompts = idx.prompt.split('|');
          unfoldedResult.push(...prompts.map((x: any) => {
            return {
              prompt: x.trim(),
              completion: idx.completion,
            }
          }));
        }
        this.dataSource = unfoldedResult;
      },
      error: (error: any) => {
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
