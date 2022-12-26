
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
export class TrainingDialogComponent implements OnInit {

  dataSource: any[] = [];

  constructor(
    private dialogRef: MatDialogRef<TrainingDialogComponent>,
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

  start_training() {
  }

  close() {
    this.dialogRef.close();
  }
}
