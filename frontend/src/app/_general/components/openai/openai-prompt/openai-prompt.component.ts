
/*
 * Copyright (c) Aista Ltd, and Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
export class OpenAIPromptComponent implements OnInit {

  @Input() currentFileData: any;
  @Input() fileType: string;
  @Output() callback? = new EventEmitter<string>();
  @Input() callbackText?: string = null;
  @Input() dialogue?: boolean = false;

  openAiEnabled: boolean = false;
  waitingForAnswer: boolean = false;
  openAiPrompt: string = '';

  constructor(
    private dialog: MatDialog,
    private generalService: GeneralService,
    private openAiService: OpenAIService) { }

  ngOnInit() {

    this.generalService.showLoading();
    this.openAiService.isConfigured().subscribe({
      next: (isConfigured: any) => {

        this.openAiEnabled = isConfigured.result;
        this.generalService.hideLoading();
      },
      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error, 'errorMessage', 'Ok');
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
        this.generalService.hideLoading();
      }
    });
  }

  askOpenAi() {

    if (!this.openAiPrompt || this.openAiPrompt === '') {
      this.generalService.showFeedback('No question specified', 'errorMessage');
      return;
    }

    this.generalService.showLoading();
    this.waitingForAnswer = true;

    let currentFileContent = this.currentFileData.content;
    if (currentFileContent && currentFileContent.length > 0) {
      currentFileContent = '[CURRENT_CONTENT]\r\n\r\n' + currentFileContent;
    }
    this.openAiService.query(
      this.openAiPrompt,
      this.fileType,
      false,
      this.currentFileData.path,
      null,
      currentFileContent).subscribe({
      next: (result: any) => {

        this.generalService.hideLoading();
        this.waitingForAnswer = false;

        if (this.dialogue === true) {
          this.dialog.open(OpenAIAnswerDialogComponent, {
            width: '80vw',
            maxWidth: '1024px',
            data: {
              snippet: result.result,
              prompt: this.openAiPrompt,
              fileType: this.fileType,
              callback: this.callback,
              callbackText: this.callbackText,
            },
          });
        } else {
          this.callback.emit(result.result);
        }
        this.openAiPrompt = '';
      },
      error: (error: any) => {

        this.generalService.showFeedback(error?.error?.message ?? error, 'errorMessage');
        this.generalService.hideLoading();
        this.waitingForAnswer = false;
      }
    });
  }
}
