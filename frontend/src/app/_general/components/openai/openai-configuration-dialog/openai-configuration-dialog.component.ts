
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MagicResponse } from 'src/app/_general/models/magic-response.model';
import { GeneralService } from 'src/app/_general/services/general.service';
import { OpenAIService } from 'src/app/_general/services/openai.service';

/**
 * OpenAI configuration modal dialog allowing user to store his
 * OpenAI API key to configuration object.
 */
@Component({
  selector: 'app-openai-configuration-dialog',
  templateUrl: './openai-configuration-dialog.component.html',
  styleUrls: ['./openai-configuration-dialog.component.scss']
})
export class OpenAIConfigurationDialogComponent implements OnInit {

  openApiKey: string = '';

  constructor(
    private dialogRef: MatDialogRef<OpenAIConfigurationDialogComponent>,
    private openAiService: OpenAIService,
    private generalService: GeneralService) { }

  ngOnInit() {

    this.generalService.showLoading();

    this.openAiService.key().subscribe({
      next: (result: MagicResponse) => {

        this.openApiKey = result.result || '';
        this.generalService.hideLoading();
      },
      error: (error: any) => {

        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  save() {

    if (this.openApiKey.length < 20) {
      this.generalService.showFeedback('Not a valid API key', 'errorMessage');
      return;
    }

    this.generalService.showLoading();

    this.openAiService.setKey(this.openApiKey).subscribe({
      next: () => {

        this.generalService.showFeedback('Your OpenAI API key was saved to your configuration', 'successMessage');
        this.generalService.hideLoading();
        this.dialogRef.close({ configured: true });
      },
      error: (error: any) => {

        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  close() {
    this.dialogRef.close({ configured: false });
  }
}
