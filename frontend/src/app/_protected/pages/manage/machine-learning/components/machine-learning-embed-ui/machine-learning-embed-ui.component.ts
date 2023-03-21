
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

  theme: string = 'chess';
  themes: string[] = [];
  type: string = null;
  header: string = 'Ask about our services or products';
  buttonTxt: string = 'AI Chat';
  search: boolean = false;
  chat: boolean = true;
  markdown: boolean = true;
  speech: boolean = false;

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

    console.log(this.data);
    if (this.data.search === true) {
      this.search = true;
    }

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

  getEmbed() {

    return `<script src="${this.backendService.active.url}/magic/system/openai/include-javascript?markdown=${this.markdown ? 'true' : 'false'}&speech=${this.speech ? 'true' : 'false'}&search=${this.search ? 'true' : 'false'}&chat=${this.chat ? 'true' : 'false'}&css=${encodeURIComponent(this.theme)}&file=default&type=${encodeURIComponent(this.type)}&header=${encodeURIComponent(this.header)}&button=${encodeURIComponent(this.buttonTxt)}" defer></script>`;
  }

  embed() {

    if (this.search === false && this.chat === false) {

      this.generalService.showFeedback('You have to choose at least one of chat or search', 'errorMessage');
      return;
    }

    this.clipboard.copy(this.getEmbed());
    this.generalService.showFeedback('HTML to include your bot can be found on your clipboard', 'successMessage');
    if (this.data.noClose !== true) {
      this.dialogRef.close();
    }
  }
}
