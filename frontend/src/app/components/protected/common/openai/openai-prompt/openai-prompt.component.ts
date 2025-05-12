
/*
 * Copyright (c) 2023 Thomas Hansen - For license inquiries you can contact thomas@ainiro.io.
 */

// System imports
import { MatDialog } from '@angular/material/dialog';
import { OpenAIService } from 'src/app/services/openai.service';
import { GeneralService } from 'src/app/services/general.service';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

// Custom imports
import { OpenAIAnswerDialogComponent } from 'src/app/components/protected/common/openai/openai-answer-dialog/openai-answer-dialog.component';
import { OpenAIConfigurationDialogComponent } from 'src/app/components/protected/common/openai/openai-configuration-dialog/openai-configuration-dialog.component';

/**
 * OpenAI prompt component allowing you to ask questions to OpenAI through their API.
 */
@Component({
  selector: 'app-openai-prompt',
  templateUrl: './openai-prompt.component.html',
  styleUrls: ['./openai-prompt.component.scss']
})
export class OpenAIPromptComponent implements OnInit {

  @Input() currentFileContent: string;
  @Input() currentFileSession: string;
  @Input() fileType: string;
  @Output() callback? = new EventEmitter<string>();
  @Input() callbackText?: string = null;
  @Input() dialogue?: boolean = false;
  @Input() createContext?: () => Promise<string>;

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

        this.generalService.hideLoading();
        this.openAiEnabled = isConfigured.result;
      },
      error: (error: any) => {

        this.generalService.hideLoading();
        this.generalService.showFeedback(error?.error?.message, 'errorMessage', 'Ok');
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

  async askOpenAi() {

    // Sanity checking invocation
    if (!this.openAiPrompt || this.openAiPrompt.trim() === '') {
      this.generalService.showFeedback('You have to supply a prompt', 'errorMessage');
      return;
    }

    this.generalService.showLoading();
    this.waitingForAnswer = true;

    let currentFileContent = this.currentFileContent;

    if (this.createContext) {
      const res = await this.createContext();
      currentFileContent = res;
    }

    this.openAiService.query(
      this.openAiPrompt,
      this.fileType,
      false,
      this.currentFileSession,
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
