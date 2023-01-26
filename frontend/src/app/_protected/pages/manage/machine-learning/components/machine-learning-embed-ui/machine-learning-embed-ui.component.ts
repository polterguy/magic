
/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

import { Component, Inject, OnInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { BackendService } from 'src/app/_general/services/backend.service';
import { GeneralService } from 'src/app/_general/services/general.service';
import { OpenAIService } from 'src/app/_general/services/openai.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Helper component to create HTML required to embed chatbot in HTML.
 */
@Component({
  selector: 'app-machine-learning-embed-ui',
  templateUrl: './machine-learning-embed-ui.component.html'
})
export class MachineLearningEmbedUiComponent implements OnInit {

  theme: string = 'default';
  themes: string[] = [];
  type: string = null;
  header: string = 'Ask and you shall receive an answer';
  buttonTxt: string = 'AI Chat';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private clipboard: Clipboard,
    private backendService: BackendService,
    private openAiService: OpenAIService,
    private dialogRef: MatDialogRef<MachineLearningEmbedUiComponent>,
    private generalService: GeneralService) {
      this.type = this.data.type;
    }

  ngOnInit() {

    // Retrieving all themes from the backend.
    this.openAiService.themes().subscribe({
      next: (themes: string[]) => {

        this.themes = themes;
      },
      error: () => {

        this.generalService.showFeedback('Something went wrong as we tried to create your snippet', 'errorMessage');
        this.generalService.hideLoading();
      }
    });
  }

  embed() {

    this.clipboard.copy(`<script src="${this.backendService.active.url}/magic/system/openai/include-javascript?file=${encodeURIComponent(this.theme)}&type=${encodeURIComponent(this.type)}&header=${encodeURIComponent(this.header)}&button=${encodeURIComponent(this.buttonTxt)}" defer></script>`);
    this.generalService.showFeedback('JavaScript inclusion for your AI bot can be found on your clipboard');
    this.dialogRef.close();
  }
}
