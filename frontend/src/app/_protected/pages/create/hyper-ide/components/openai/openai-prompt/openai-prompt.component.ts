
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GeneralService } from 'src/app/_general/services/general.service';
import { OpenAIService } from 'src/app/_general/services/openai.service';
import { OpenAIAnswerDialogComponent } from '../openai-answer-dialog/openai-answer-dialog.component';
import { OpenAIConfigurationDialogComponent } from '../openai-configuration-dialog/openai-configuration-dialog.component';

/**
 * OpenAI prompt component allowing you to ask questions to OpenAI through their API.
 */
@Component({
  selector: 'app-openai-prompt',
  templateUrl: './openai-prompt.component.html',
  styleUrls: ['./openai-prompt.component.scss']
})
export class OpenaiPromptComponent implements OnInit {

  @Input() fileType: string;

  openAiEnabled: boolean = false;
  waitingForAnswer: boolean = false;
  openAiPrompt: string = '';

  constructor(
    private dialog: MatDialog,
    private generalService: GeneralService,
    private openAiService: OpenAIService) { }

  ngOnInit() {

    this.openAiService.enabled().subscribe({
      next: (result: any) => {
        this.openAiEnabled = result.result;
      }
    });
  }

  getTooltip() {
    switch (this.fileType) {

      case 'hl':
        return 'Ask the Machine to create some Hyperlambda code for you';

      case 'ts':
        return 'Ask the Machine to create TypeScript code for you';

      case 'js':
        return 'Ask the Machine to create JavaScript code for you';

      case 'html':
      case 'htm':
        return 'Ask the Machine to create HTML for you';

      case 'css':
        return 'Ask the Machine to create CSS for you';

      case 'sql':
        return 'Ask the Machine to create SQL for you';

      case 'md':
        return 'Ask the Machine to create Markdown for you';

      default:
        return 'Ask the Machine to help you out';
    }
  }

  configureOpenAi() {

    const dialog = this.dialog.open(OpenAIConfigurationDialogComponent, {
      width: '80vw',
      maxWidth: '550px',
    });
    dialog.afterClosed().subscribe((result: {configured: boolean, start_training: boolean}) => {

      if (result?.configured) {

        this.openAiEnabled = true;
        if (result.start_training) {

          this.generalService.showLoading();

          this.openAiService.start_training().subscribe({
            next: () => {

              this.generalService.showFeedback('Training of OpenAI successfully started');
              this.generalService.hideLoading();
            },
            error: (error: any) => {
              this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
              this.generalService.hideLoading();
            }
          });
        }
      }
    });
  }

  askOpenAi() {

    this.generalService.showLoading();
    this.waitingForAnswer = true;

    this.openAiService.query(this.openAiPrompt + (this.fileType === 'hl' ? ' ->' : ''), this.fileType).subscribe({
      next: (result: any) => {

        this.generalService.hideLoading();
        this.waitingForAnswer = false;

        const dialog = this.dialog.open(OpenAIAnswerDialogComponent, {
          width: '80vw',
          maxWidth: '1024px',
          data: {
            snippet: result[0].text,
            prompt: this.openAiPrompt,
            fileType: this.fileType,
          },
        });
        dialog.afterClosed().subscribe((data: any) => {
          console.log(data);
        });
      },
      error: (error: any) => {
        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        this.generalService.hideLoading();
        this.waitingForAnswer = false;
      }
    });
  }
}
