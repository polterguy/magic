
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { OpenAIService } from 'src/app/_general/services/openai.service';

/**
 * OpenAI training dialog component.
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
        this.dataSource = result;
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

  start_training() {

    // OpenAI API requires JSONL format.
    let jsonl = JSON.stringify(this.dataSource).substring(1);
    jsonl = jsonl.substring(0, jsonl.length - 1);
    while (jsonl.includes('},')) {
      jsonl = jsonl.replace('},', '}\r\n');
    }

    // Uploading as file to backend.
    this.generalService.showLoading();
    this.openAiService.start_training(jsonl).subscribe({
      next: () => {
        this.dialogRef.close(true);
        this.generalService.hideLoading();
      },
      error: (error: any) => {
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }
}
